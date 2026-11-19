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
            out.push('{');
            for (index, (key, child)) in map.iter().enumerate() {
                if index > 0 {
                    out.push(',');
                }
                write_json_string(out, key);
                out.push(':');
                write_json(out, child);
            }
            out.push('}');
        }
    }
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
    fn stringify_preserves_key_order_and_escapes() {
        let value = json!({"b": 1, "a": "x\"y"});
        assert_eq!(js_json_stringify(&value), r#"{"b":1,"a":"x\"y"}"#);
    }
}
