//! JavaScript `String()`, truthiness, and `JSON.stringify` for JSON values.
//!
//! Substitution has to emit the same text Node produces. Numbers follow
//! `Number.prototype.toString` (shortest round-trip, `e+` for positive
//! exponents). Objects and arrays go through `JSON.stringify` when a
//! substituted value is an object, which is what `execute.ts` does.

use serde_json::{Number, Value};

/// JavaScript truthiness for a JSON value.
pub fn js_truthy(value: &Value) -> bool {
    match value {
        Value::Null => false,
        Value::Bool(flag) => *flag,
        Value::Number(number) => !js_number_is_zero(number),
        Value::String(text) => !text.is_empty(),
        Value::Array(_) | Value::Object(_) => true,
    }
}

fn js_number_is_zero(number: &Number) -> bool {
    if let Some(int) = number.as_i64() {
        return int == 0;
    }
    if let Some(uint) = number.as_u64() {
        return uint == 0;
    }
    number.as_f64().is_some_and(|float| float == 0.0)
}

/// `value || ''` from the variable shapers. Falsy becomes `""`; truthy is kept.
pub fn js_or_empty(value: Option<&Value>) -> Value {
    match value {
        Some(inner) if js_truthy(inner) => inner.clone(),
        _ => Value::String(String::new()),
    }
}

/// `value || false` from the condition and review shapers.
pub fn js_or_false(value: Option<&Value>) -> Value {
    match value {
        Some(inner) if js_truthy(inner) => inner.clone(),
        _ => Value::Bool(false),
    }
}

/// `Number.prototype.toString` / `String(number)`.
pub fn js_number_to_string(number: &Number) -> String {
    if let Some(int) = number.as_i64() {
        // Integers inside the safe range match JS exactly. Outside it, JS has
        // already rounded to f64 by the time String() runs.
        if (-(1_i64 << 53)..=(1_i64 << 53)).contains(&int) {
            return int.to_string();
        }
        return format_f64(int as f64);
    }
    if let Some(uint) = number.as_u64() {
        if uint <= (1_u64 << 53) {
            return uint.to_string();
        }
        return format_f64(uint as f64);
    }
    match number.as_f64() {
        Some(float) => format_f64(float),
        None => number.to_string(),
    }
}

fn format_f64(float: f64) -> String {
    if float == 0.0 {
        return "0".to_string();
    }
    if float.is_nan() {
        return "NaN".to_string();
    }
    if float.is_infinite() {
        return if float.is_sign_positive() {
            "Infinity".to_string()
        } else {
            "-Infinity".to_string()
        };
    }
    let mut buffer = ryu::Buffer::new();
    let printed = buffer.format_finite(float);
    match printed.split_once('e') {
        Some((mantissa, exponent)) if !exponent.starts_with('-') && !exponent.starts_with('+') => {
            format!("{mantissa}e+{exponent}")
        }
        _ => printed.to_string(),
    }
}

/// `String(value)` for primitives. Objects use `JSON.stringify` at the
/// substitution call site, matching `typeof value === "object"`.
pub fn js_primitive_string(value: &Value) -> String {
    match value {
        Value::Null => "null".to_string(),
        Value::Bool(true) => "true".to_string(),
        Value::Bool(false) => "false".to_string(),
        Value::Number(number) => js_number_to_string(number),
        Value::String(text) => text.clone(),
        Value::Array(_) | Value::Object(_) => js_json_stringify(value),
    }
}

/// `value.toString()` for the Telegram `messageId` mapping.
/// Arrays join with commas; plain objects become `[object Object]`.
pub fn js_to_string_method(value: &Value) -> String {
    match value {
        Value::Array(items) => items
            .iter()
            .map(js_join_element)
            .collect::<Vec<_>>()
            .join(","),
        Value::Object(_) => "[object Object]".to_string(),
        other => js_primitive_string(other),
    }
}

fn js_join_element(value: &Value) -> String {
    match value {
        Value::Null => String::new(),
        Value::Array(_) => js_to_string_method(value),
        Value::Object(_) => "[object Object]".to_string(),
        other => js_primitive_string(other),
    }
}

/// `JSON.stringify` for values that originated as JSON.
pub fn js_json_stringify(value: &Value) -> String {
    let mut out = String::new();
    write_json(&mut out, value);
    out
}

fn write_json(out: &mut String, value: &Value) {
    match value {
        Value::Null => out.push_str("null"),
        Value::Bool(true) => out.push_str("true"),
        Value::Bool(false) => out.push_str("false"),
        Value::Number(number) => out.push_str(&js_number_to_string(number)),
        Value::String(text) => write_json_string(out, text),
        Value::Array(items) => {
            out.push('[');
            for (index, item) in items.iter().enumerate() {
                if index > 0 {
                    out.push(',');
                }
                write_json(out, item);
            }
            out.push(']');
        }
        Value::Object(map) => {
            // JSON.stringify lists canonical array indexes first, ascending,
            // then every other key in insertion order.
            let mut indexes: Vec<(u32, &str, &Value)> = Vec::new();
            let mut rest: Vec<(&str, &Value)> = Vec::new();
            for (key, child) in map {
                if let Some(index) = canonical_array_index(key) {
                    indexes.push((index, key, child));
                } else {
                    rest.push((key, child));
                }
            }
            indexes.sort_by_key(|(index, _, _)| *index);
            out.push('{');
            let mut wrote = false;
            for (_, key, child) in indexes {
                if wrote {
                    out.push(',');
                }
                wrote = true;
                write_json_string(out, key);
                out.push(':');
                write_json(out, child);
            }
            for (key, child) in rest {
                if wrote {
                    out.push(',');
                }
                wrote = true;
                write_json_string(out, key);
                out.push(':');
                write_json(out, child);
            }
            out.push('}');
        }
    }
}

/// A canonical array index is the decimal form of an integer in `0 .. 2^32 - 1`
/// with no leading zeros. `JSON.stringify` emits those keys first.
fn canonical_array_index(key: &str) -> Option<u32> {
    if key.is_empty() || (key.len() > 1 && key.starts_with('0')) || key.len() > 10 {
        return None;
    }
    if !key.bytes().all(|byte| byte.is_ascii_digit()) {
        return None;
    }
    let value: u64 = key.parse().ok()?;
    if value >= 0xFFFF_FFFF {
        return None;
    }
    u32::try_from(value).ok()
}

fn write_json_string(out: &mut String, text: &str) {
    out.push('"');
    for ch in text.chars() {
        match ch {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\u{0008}' => out.push_str("\\b"),
            '\u{000c}' => out.push_str("\\f"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if (c as u32) < 0x20 || c == '\u{2028}' || c == '\u{2029}' => {
                out.push_str(&format!("\\u{code:04x}", code = c as u32));
            }
            c => out.push(c),
        }
    }
    out.push('"');
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn numbers_match_javascript_string() {
        assert_eq!(js_number_to_string(json!(0).as_number().expect("n")), "0");
        assert_eq!(
            js_number_to_string(json!(1.5).as_number().expect("n")),
            "1.5"
        );
        assert_eq!(
            js_number_to_string(json!(0.1).as_number().expect("n")),
            "0.1"
        );
        assert_eq!(
            js_number_to_string(json!(1e21).as_number().expect("n")),
            "1e+21"
        );
        assert_eq!(
            js_number_to_string(json!(1e-7).as_number().expect("n")),
            "1e-7"
        );
    }

    #[test]
    fn stringify_preserves_non_index_key_order_and_escapes() {
        let value = json!({"b": 1, "a": "x\"y"});
        assert_eq!(js_json_stringify(&value), r#"{"b":1,"a":"x\"y"}"#);
    }

    #[test]
    fn stringify_emits_array_indexes_first() {
        let value = json!({"b": 1, "10": "ten", "2": "two", "a": "ay", "01": "padded"});
        assert_eq!(
            js_json_stringify(&value),
            r#"{"2":"two","10":"ten","b":1,"a":"ay","01":"padded"}"#
        );
        let mut edge = serde_json::Map::new();
        edge.insert("b".to_string(), json!(1));
        edge.insert("4294967295".to_string(), json!("nope"));
        edge.insert("4294967294".to_string(), json!("max"));
        edge.insert("02".to_string(), json!("pad"));
        assert_eq!(
            js_json_stringify(&Value::Object(edge)),
            r#"{"4294967294":"max","b":1,"4294967295":"nope","02":"pad"}"#
        );
    }
}
