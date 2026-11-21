//! Engine variable substitution (`execute.ts` / `lib/workflow-engine.ts`).
//!
//! This is intentionally not `lib/integrations/executor.ts`. The two TypeScript
//! functions disagree; see `engine/README.md`. Canonical behavior here is the
//! execute.ts function:
//!
//! - placeholders are `{{name}}` with the name trimmed and de-duplicated
//! - only the exact `{{trimmed}}` token is replaced (interior spaces stay)
//! - missing, null, and undefined become an empty string
//! - objects and arrays become `JSON.stringify`
//! - names are replaced one at a time, so an earlier value can introduce a
//!   later placeholder
//! - replacement text follows `String.prototype.replace` (`$$`, `$&`, `$``, `$'`)

use std::collections::HashSet;

use serde_json::Value;
use tracing::warn;

use crate::jsonutil::{js_json_stringify, js_primitive_string};

pub fn substitute_variables(template: &str, variables: &Value) -> String {
    let names = extract_variables(template);
    let mut current = template.to_string();
    for name in names {
        let needle = format!("{{{{{name}}}}}");
        let replacement = match lookup(variables, &name) {
            Some(value) => coerce(&value),
            None => {
                warn!(variable = %name, "variable not found; substituting empty string");
                String::new()
            }
        };
        current = js_replace_all(&current, &needle, &replacement);
    }
    current
}

/// Walk every string in a JSON config. Non-strings are left alone.
pub fn substitute_tree(value: &Value, variables: &Value) -> Value {
    match value {
        Value::String(text) => Value::String(substitute_variables(text, variables)),
        Value::Array(items) => Value::Array(
            items
                .iter()
                .map(|item| substitute_tree(item, variables))
                .collect(),
        ),
        Value::Object(map) => {
            let mut out = serde_json::Map::new();
            for (key, child) in map {
                out.insert(key.clone(), substitute_tree(child, variables));
            }
            Value::Object(out)
        }
        other => other.clone(),
    }
}

fn coerce(value: &Value) -> String {
    match value {
        Value::Array(_) | Value::Object(_) => js_json_stringify(value),
        other => js_primitive_string(other),
    }
}

/// `extractVariables` from `lib/variables-client.ts`: `{{...}}`, trim, first-seen order.
fn extract_variables(prompt: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut seen = HashSet::new();
    let mut rest = prompt;
    while let Some(start) = rest.find("{{") {
        let after = &rest[start + 2..];
        match after.find("}}") {
            Some(end) if end > 0 && !after[..end].contains('}') => {
                let trimmed = js_trim(&after[..end]);
                if seen.insert(trimmed.to_string()) {
                    out.push(trimmed.to_string());
                }
                rest = &after[end + 2..];
            }
            Some(_) => {
                // `[^}]+` did not sit directly in front of `}}`. Resume after this `{{`.
                rest = &rest[start + 2..];
            }
            None => break,
        }
    }
    out
}

/// `String.prototype.trim`: Unicode whitespace plus BOM, which Rust `trim` skips.
fn js_trim(text: &str) -> &str {
    text.trim_matches(|ch: char| ch.is_whitespace() || ch == '\u{FEFF}')
}

fn lookup(root: &Value, path: &str) -> Option<Value> {
    let mut current = CowValue::Borrowed(root);
    for part in path.split('.') {
        if current.as_value().is_null() {
            return None;
        }
        current = CowValue::Owned(step(current.as_value(), part)?);
    }
    if current.as_value().is_null() {
        None
    } else {
        Some(current.into_owned())
    }
}

enum CowValue<'a> {
    Borrowed(&'a Value),
    Owned(Value),
}

impl<'a> CowValue<'a> {
    fn as_value(&self) -> &Value {
        match self {
            CowValue::Borrowed(value) => value,
            CowValue::Owned(value) => value,
        }
    }

    fn into_owned(self) -> Value {
        match self {
            CowValue::Borrowed(value) => value.clone(),
            CowValue::Owned(value) => value,
        }
    }
}

fn step(current: &Value, part: &str) -> Option<Value> {
    match current {
        Value::Object(map) => map.get(part).cloned(),
        Value::Array(items) if part == "length" => {
            Some(Value::from(u64::try_from(items.len()).ok()?))
        }
        Value::Array(items) => {
            let index = array_index(part)?;
            items.get(index).cloned()
        }
        _ => None,
    }
}

/// Canonical JS array index: `"0"` or a decimal without a leading zero, below `2^32 - 1`.
fn array_index(part: &str) -> Option<usize> {
    if part.is_empty() || (part.len() > 1 && part.starts_with('0')) {
        return None;
    }
    if !part.bytes().all(|byte| byte.is_ascii_digit()) {
        return None;
    }
    let index: u64 = part.parse().ok()?;
    if index >= 0xFFFF_FFFF {
        return None;
    }
    usize::try_from(index).ok()
}

/// `String.prototype.replace` with a string replacement and a global literal search.
/// `$`` and `$'` refer to the string being searched, and inserted text is not
/// scanned again for this same needle.
fn js_replace_all(subject: &str, needle: &str, replacement: &str) -> String {
    if needle.is_empty() {
        return subject.to_string();
    }
    let mut out = String::new();
    let mut last = 0;
    for (index, _) in subject.match_indices(needle) {
        out.push_str(&subject[last..index]);
        out.push_str(&expand_replacement(replacement, subject, index, needle));
        last = index + needle.len();
    }
    out.push_str(&subject[last..]);
    out
}

fn expand_replacement(
    replacement: &str,
    subject: &str,
    match_start: usize,
    matched: &str,
) -> String {
    let chars: Vec<char> = replacement.chars().collect();
    let mut out = String::new();
    let mut index = 0;
    while index < chars.len() {
        if chars[index] != '$' {
            out.push(chars[index]);
            index += 1;
            continue;
        }
        if index + 1 >= chars.len() {
            out.push('$');
            break;
        }
        match chars[index + 1] {
            '$' => {
                out.push('$');
                index += 2;
            }
            '&' => {
                out.push_str(matched);
                index += 2;
            }
            '`' => {
                out.push_str(&subject[..match_start]);
                index += 2;
            }
            '\'' => {
                out.push_str(&subject[match_start + matched.len()..]);
                index += 2;
            }
            '0'..='9' => {
                // The engine regex has no capture groups, so `$n` stays literal.
                // ES consumes at most two digits.
                out.push('$');
                out.push(chars[index + 1]);
                index += 2;
                if index < chars.len() && chars[index].is_ascii_digit() {
                    out.push(chars[index]);
                    index += 1;
                }
            }
            _ => {
                out.push('$');
                index += 1;
            }
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn needle_wraps_name_in_braces() {
        let name = "in.name";
        assert_eq!(format!("{{{{{name}}}}}"), "{{in.name}}");
    }

    #[test]
    fn missing_becomes_empty_and_spaces_are_kept() {
        let vars = json!({"name": "Ada"});
        assert_eq!(substitute_variables("Hello {{name}}!", &vars), "Hello Ada!");
        assert_eq!(substitute_variables("Hello {{missing}}!", &vars), "Hello !");
        assert_eq!(
            substitute_variables("Hello {{ name }}!", &vars),
            "Hello {{ name }}!"
        );
    }

    #[test]
    fn null_nested_is_empty_and_objects_are_json() {
        let vars = json!({"a": {"b": null, "meta": {"z": 1, "y": "q"}}});
        assert_eq!(substitute_variables("X{{a.b}}Y", &vars), "XY");
        assert_eq!(
            substitute_variables("{{a.meta}}", &vars),
            r#"{"z":1,"y":"q"}"#
        );
    }

    #[test]
    fn path_walk_wins_over_a_dotted_own_key() {
        let vars = json!({"a.b": "direct", "a": {"b": "nested"}});
        assert_eq!(substitute_variables("{{a.b}}", &vars), "nested");
    }

    #[test]
    fn sequential_replacement_rescans_inserted_placeholders() {
        let vars = json!({"a": "{{b}}", "b": "X"});
        assert_eq!(substitute_variables("{{a}} {{b}}", &vars), "X X");
    }

    #[test]
    fn dollar_replacement_follows_string_replace() {
        let vars = json!({"v": "a$&b"});
        assert_eq!(substitute_variables("{{v}}", &vars), "a{{v}}b");
        let vars = json!({"v": "$'"});
        assert_eq!(substitute_variables("x{{v}}y", &vars), "xyy");
        let vars = json!({"v": "$$"});
        assert_eq!(substitute_variables("{{v}}", &vars), "$");
        let vars = json!({"v": "$1"});
        assert_eq!(substitute_variables("{{v}}", &vars), "$1");
    }

    #[test]
    fn array_length_and_index() {
        let vars = json!({"a": ["x", "y"]});
        assert_eq!(substitute_variables("{{a.length}}", &vars), "2");
        assert_eq!(substitute_variables("{{a.0}}", &vars), "x");
        assert_eq!(substitute_variables("{{a.01}}", &vars), "");
    }
}
