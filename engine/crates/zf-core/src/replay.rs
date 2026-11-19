//! Side-effect-free replay used by the parity harness.
//!
//! Recorded outputs stand in for AI and integration results. Entry nodes still
//! publish `inputData`, matching `execute.ts`. Strings inside each executed
//! node's config are substituted with the engine substituter.

use serde_json::{Map, Value};

use crate::error::EngineError;
use crate::graph::{self, Walk};
use crate::substitute::substitute_tree;
use crate::types::{ReplayInput, ReplayResult, WorkflowNode};
use crate::variables::{self, apply_entry_output, collect_available_variables};

pub fn replay(input: &ReplayInput) -> ReplayResult {
    let mut order = Vec::new();
    let mut variables = Map::new();
    let mut substituted = Map::new();

    let prepared = match graph::prepare(
        &input.nodes,
        &input.connections,
        input.entry_node_id.as_deref(),
    ) {
        Ok(prepared) => prepared,
        Err(error) => {
            return ReplayResult::failure(error.to_string(), order, variables, substituted);
        }
    };
    let mut walk = graph::start_walk(prepared);
    let mut output_data = Map::new();

    loop {
        let node = match graph::shift_ready(&mut walk) {
            Ok(Some(node)) => node,
            Ok(None) => break,
            Err(error) => {
                return ReplayResult::failure(error.to_string(), order, variables, substituted);
            }
        };
        order.push(node.id.clone());

        if let Err(error) = visit_node(
            input,
            &node,
            &mut output_data,
            &mut variables,
            &mut substituted,
        ) {
            return ReplayResult::failure(error, order, variables, substituted);
        }

        if let Err(error) = advance(&mut walk, &node, output_data.get(&node.id)) {
            return ReplayResult::failure(error.to_string(), order, variables, substituted);
        }
    }

    if let Some(message) = graph::unfinished_message(&input.nodes, &walk.queued, &walk.executed) {
        return ReplayResult::failure(message, order, variables, substituted);
    }

    ReplayResult::success(order, variables, substituted)
}

fn visit_node(
    input: &ReplayInput,
    node: &WorkflowNode,
    output_data: &mut Map<String, Value>,
    variables: &mut Map<String, Value>,
    substituted: &mut Map<String, Value>,
) -> Result<(), String> {
    let parsed = variables::parse_config(node.config.as_deref())?;
    let available = collect_available_variables(
        &node.id,
        &input.connections,
        &input.nodes,
        &input.input_data,
        output_data,
    )?;
    let substituted_config = substitute_tree(&parsed, &Value::Object(available.clone()));
    variables.insert(node.id.clone(), Value::Object(available));
    substituted.insert(node.id.clone(), substituted_config);
    apply_recorded_output(node, &input.input_data, output_data, &input.outputs);
    Ok(())
}

fn apply_recorded_output(
    node: &WorkflowNode,
    input_data: &Value,
    output_data: &mut Map<String, Value>,
    recorded: &Map<String, Value>,
) {
    if node.node_type == "entry" {
        if matches!(node.entry_type.as_deref(), Some("api" | "form" | "webhook")) {
            apply_entry_output(output_data, input_data);
        }
        return;
    }
    if let Some(value) = recorded.get(&node.id) {
        output_data.insert(node.id.clone(), value.clone());
    }
}

fn advance(
    walk: &mut Walk,
    node: &WorkflowNode,
    node_output: Option<&Value>,
) -> Result<(), EngineError> {
    let all = walk.adjacency.get(&node.id).cloned().unwrap_or_default();
    let outgoing = graph::outgoing_connections(node, &all, node_output)?;
    graph::enqueue_successors(
        &outgoing,
        &mut walk.indegree,
        &mut walk.ready,
        &mut walk.queued,
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{ReplayInput, WorkflowConnection, WorkflowNode};
    use serde_json::json;

    fn node(id: &str, node_type: &str, label: &str, config: Option<&str>) -> WorkflowNode {
        WorkflowNode {
            id: id.to_string(),
            node_type: node_type.to_string(),
            label: label.to_string(),
            entry_type: if node_type == "entry" {
                Some("form".to_string())
            } else {
                None
            },
            config: config.map(str::to_string),
        }
    }

    #[test]
    fn substitutes_an_entry_field_and_records_order() {
        let input = ReplayInput {
            nodes: vec![
                node("entry-1", "entry", "Support Ticket", None),
                node(
                    "ai-1",
                    "ai",
                    "Summarize",
                    Some(r#"{"aiConfig":{"userPrompt":"Hello {{support_ticket.customer_name}}"}}"#),
                ),
            ],
            connections: vec![WorkflowConnection {
                id: "c1".to_string(),
                from_node_id: "entry-1".to_string(),
                to_node_id: "ai-1".to_string(),
                source_handle: None,
                target_handle: None,
            }],
            input_data: json!({"customer_name": "Ada"}),
            entry_node_id: None,
            outputs: Map::new(),
        };
        let result = replay(&input);
        assert!(result.ok, "{:?}", result.error);
        assert_eq!(
            result.order,
            vec!["entry-1".to_string(), "ai-1".to_string()]
        );
        assert_eq!(
            result
                .substituted
                .get("ai-1")
                .and_then(|value| value.pointer("/aiConfig/userPrompt")),
            Some(&json!("Hello Ada"))
        );
    }

    #[test]
    fn multiple_roots_without_a_selection_fail() {
        let input = ReplayInput {
            nodes: vec![
                node("entry-a", "entry", "Entry A", None),
                node("entry-b", "entry", "Entry B", None),
            ],
            connections: Vec::new(),
            input_data: json!({}),
            entry_node_id: None,
            outputs: Map::new(),
        };
        let result = replay(&input);
        assert!(!result.ok);
        assert_eq!(
            result.error.as_deref(),
            Some(
                "Workflow has multiple entry points: Entry A (entry-a), Entry B (entry-b). Specify 'entryNodeId' to select one."
            )
        );
    }
}
