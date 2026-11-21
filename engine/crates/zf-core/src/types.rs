//! Workflow shapes shared with TypeScript via ts-rs.
//!
//! Field names match the objects `execute.ts` builds from `workflow_nodes` and
//! `workflow_connections`. `config` is the JSON text stored in the database,
//! not a parsed object.

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowNode {
    pub id: String,
    #[serde(rename = "type")]
    #[ts(rename = "type")]
    pub node_type: String,
    pub label: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub entry_type: Option<String>,
    /// JSON text from `workflow_nodes.config`. Empty and missing both mean `{}`.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub config: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowConnection {
    pub id: String,
    pub from_node_id: String,
    pub to_node_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_handle: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub target_handle: Option<String>,
}

/// One side-effect-free replay. `outputs` holds recorded `outputData[nodeId]`
/// values (the raw executor payload, before variable shaping).
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct ReplayInput {
    pub nodes: Vec<WorkflowNode>,
    pub connections: Vec<WorkflowConnection>,
    #[ts(type = "Record<string, unknown>")]
    pub input_data: Value,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub entry_node_id: Option<String>,
    #[ts(type = "Record<string, unknown>")]
    pub outputs: Map<String, Value>,
}

/// What the parity harness compares. `variables` is the bag
/// `collectAvailableVariables` built for each executed node. `substituted` is
/// that node's config after the engine substituter walks every string.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct ReplayResult {
    pub ok: bool,
    pub error: Option<String>,
    pub order: Vec<String>,
    #[ts(type = "Record<string, unknown>")]
    pub variables: Map<String, Value>,
    #[ts(type = "Record<string, unknown>")]
    pub substituted: Map<String, Value>,
}

impl ReplayResult {
    pub fn failure(
        error: String,
        order: Vec<String>,
        variables: Map<String, Value>,
        substituted: Map<String, Value>,
    ) -> Self {
        Self {
            ok: false,
            error: Some(error),
            order,
            variables,
            substituted,
        }
    }

    pub fn success(
        order: Vec<String>,
        variables: Map<String, Value>,
        substituted: Map<String, Value>,
    ) -> Self {
        Self {
            ok: true,
            error: None,
            order,
            variables,
            substituted,
        }
    }
}
