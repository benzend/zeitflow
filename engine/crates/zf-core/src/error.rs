//! Failures raised while validating or walking a workflow graph.
//!
//! The `Display` text matches the `Error` messages thrown by
//! `lib/workflow-engine.ts` so the parity harness can compare them directly.

use thiserror::Error;

#[derive(Debug, Error)]
pub enum EngineError {
    #[error("Invalid connection: fromNodeId {from_node_id} does not exist")]
    DanglingFrom { from_node_id: String },

    #[error("Invalid connection: toNodeId {to_node_id} does not exist")]
    DanglingTo { to_node_id: String },

    #[error("No entry nodes found (all nodes have incoming connections). Check for cycles.")]
    NoEntryNodes,

    #[error("Invalid entryNodeId: {entry_node_id} is not a valid entry point")]
    InvalidEntry { entry_node_id: String },

    #[error("Workflow has multiple entry points: {labels}. Specify 'entryNodeId' to select one.")]
    MultipleEntries { labels: String },

    #[error("Node {node_id} not found in node map")]
    MissingNode { node_id: String },

    #[error("Cycle detected: node {node_id} ({label}) is being executed multiple times")]
    Cycle { node_id: String, label: String },

    #[error(
        "Condition node \"{node_id}\" has a connection without sourceHandle. All condition node connections must specify sourceHandle ('true' or 'false')."
    )]
    ConditionMissingHandle { node_id: String },

    #[error("Invalid graph state: node {node_id} has negative in-degree")]
    NegativeIndegree { node_id: String },

    #[error(
        "Workflow incomplete: {count} nodes not executed: {labels}. This indicates either a cycle or disconnected nodes in the execution path."
    )]
    Incomplete { count: usize, labels: String },

    #[error("{message}")]
    InvalidConfig { message: String },
}
