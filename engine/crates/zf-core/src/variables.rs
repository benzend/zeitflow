//! `collectAvailableVariables` from `lib/workflow-engine.ts`.
//!
//! Ancestors are discovered by BFS over incoming edges (connection order).
//! When two ancestors share a snake_case label, the one visited later wins.
//! Known node types get a fixed output shape; every other type with an object
//! output is spread as-is.

use std::collections::{HashSet, VecDeque};

use serde_json::{Map, Value};

use crate::jsonutil::{js_or_empty, js_or_false, js_to_string_method, js_truthy};
use crate::label::label_to_variable_name;
use crate::types::{WorkflowConnection, WorkflowNode};

pub fn collect_available_variables(
    node_id: &str,
    connections: &[WorkflowConnection],
    nodes: &[WorkflowNode],
    input_data: &Value,
    node_outputs: &Map<String, Value>,
) -> Result<Map<String, Value>, String> {
    let ancestors = upstream_ancestors(node_id, connections);
    let mut variables = Map::new();

    for ancestor_id in ancestors {
        let Some(source) = nodes.iter().find(|node| node.id == ancestor_id) else {
            continue;
        };
        let config = parse_config(source.config.as_deref())?;
        let node_label = if source.label.is_empty() {
            source.id.as_str()
        } else {
            source.label.as_str()
        };
        let var_name = label_to_variable_name(node_label);
        if let Some(shaped) = shape_ancestor(source, &config, input_data, node_outputs) {
            variables.insert(var_name, shaped);
        }
    }

    Ok(variables)
}

fn upstream_ancestors(node_id: &str, connections: &[WorkflowConnection]) -> Vec<String> {
    let mut visited = HashSet::new();
    let mut order = Vec::new();
    let mut queue = VecDeque::new();

    for edge in connections.iter().filter(|edge| edge.to_node_id == node_id) {
        if visited.insert(edge.from_node_id.clone()) {
            order.push(edge.from_node_id.clone());
            queue.push_back(edge.from_node_id.clone());
        }
    }

    while let Some(current) = queue.pop_front() {
        for edge in connections.iter().filter(|edge| edge.to_node_id == current) {
            if visited.insert(edge.from_node_id.clone()) {
                order.push(edge.from_node_id.clone());
                queue.push_back(edge.from_node_id.clone());
            }
        }
    }

    order
}

pub fn parse_config(config: Option<&str>) -> Result<Value, String> {
    let raw = match config {
        Some(text) if !text.is_empty() => text,
        _ => "{}",
    };
    serde_json::from_str(raw).map_err(|err| err.to_string())
}

fn shape_ancestor(
    source: &WorkflowNode,
    config: &Value,
    input_data: &Value,
    node_outputs: &Map<String, Value>,
) -> Option<Value> {
    let output = node_outputs.get(&source.id);

    if source.node_type == "entry" {
        if matches!(
            source.entry_type.as_deref(),
            Some("api" | "form" | "webhook")
        ) {
            return Some(Value::Object(entry_vars(config, input_data)));
        }
        return generic_spread(output);
    }

    let output = output.filter(|value| js_truthy(value))?;

    match source.node_type.as_str() {
        "ai" => Some(object([("output", js_or_empty(output.get("response")))])),
        "scheduler" => Some(object([
            ("eventId", js_or_empty(output.get("scheduledTime"))),
            ("eventLink", js_or_empty(output.get("calendarLink"))),
            ("scheduledTime", js_or_empty(output.get("scheduledTime"))),
        ])),
        "email" => Some(object([
            ("messageId", Value::String(String::new())),
            (
                "status",
                Value::String(status_text(output.get("success")).to_string()),
            ),
        ])),
        "slack" => Some(object([
            ("messageId", js_or_empty(output.get("messageId"))),
            ("channel", js_or_empty(output.get("channel"))),
            ("timestamp", Value::String(String::new())),
        ])),
        "sms" => Some(object([
            ("messageId", js_or_empty(output.get("messageId"))),
            (
                "status",
                Value::String(status_text(output.get("success")).to_string()),
            ),
        ])),
        "telegram" => Some(object([
            ("messageId", telegram_message_id(output.get("messageId"))),
            ("chatId", js_or_empty(output.get("chatId"))),
        ])),
        "condition" => Some(condition_vars(output)),
        "review" => Some(object([
            ("approved", js_or_false(output.get("approved"))),
            ("feedback", js_or_empty(output.get("feedback"))),
        ])),
        _ => generic_spread(Some(output)),
    }
}

fn generic_spread(output: Option<&Value>) -> Option<Value> {
    let output = output.filter(|value| js_truthy(value))?;
    match output {
        Value::Object(map) => Some(Value::Object(map.clone())),
        Value::Array(items) => {
            let mut object = Map::new();
            for (index, item) in items.iter().enumerate() {
                object.insert(index.to_string(), item.clone());
            }
            Some(Value::Object(object))
        }
        _ => None,
    }
}

fn entry_vars(config: &Value, input_data: &Value) -> Map<String, Value> {
    let mut entry = Map::new();
    if let Some(pairs) = own_entries(input_data) {
        for (key, value) in pairs {
            entry.insert(key, value);
        }
    }
    if let Some(fields) = config.get("fields").and_then(Value::as_array) {
        for field in fields {
            let Some(key) = field.get("key").and_then(Value::as_str) else {
                continue;
            };
            if let Some(value) = input_data.get(key)
                && js_truthy(value)
            {
                entry.insert(key.to_string(), value.clone());
            }
        }
    }
    entry
}

fn own_entries(input_data: &Value) -> Option<Vec<(String, Value)>> {
    match input_data {
        Value::Object(map) => Some(
            map.iter()
                .map(|(key, value)| (key.clone(), value.clone()))
                .collect(),
        ),
        Value::Array(items) => Some(
            items
                .iter()
                .enumerate()
                .map(|(index, value)| (index.to_string(), value.clone()))
                .collect(),
        ),
        _ => None,
    }
}

fn condition_vars(output: &Value) -> Value {
    let mut object = Map::new();
    object.insert("result".to_string(), js_or_false(output.get("result")));
    if let Some(left) = output.get("leftValue") {
        object.insert("leftValue".to_string(), left.clone());
    }
    if let Some(right) = output.get("rightValue") {
        object.insert("rightValue".to_string(), right.clone());
    }
    Value::Object(object)
}

fn status_text(success: Option<&Value>) -> &'static str {
    if success.is_some_and(js_truthy) {
        "sent"
    } else {
        "failed"
    }
}

fn telegram_message_id(value: Option<&Value>) -> Value {
    let Some(value) = value else {
        return Value::String(String::new());
    };
    if value.is_null() {
        return Value::String(String::new());
    }
    let text = js_to_string_method(value);
    if text.is_empty() {
        Value::String(String::new())
    } else {
        Value::String(text)
    }
}

fn object<const N: usize>(pairs: [(&str, Value); N]) -> Value {
    let mut map = Map::new();
    for (key, value) in pairs {
        map.insert(key.to_string(), value);
    }
    Value::Object(map)
}

/// Apply the entry-node writes `execute.ts` makes into `outputData`.
pub fn apply_entry_output(output_data: &mut Map<String, Value>, input_data: &Value) {
    output_data.insert("userInput".to_string(), input_data.clone());
    if let Some(pairs) = own_entries(input_data) {
        for (key, value) in pairs {
            output_data.insert(key, value);
        }
    }
}
