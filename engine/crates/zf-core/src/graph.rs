//! Graph validation, entry selection, and the BFS walk from `execute.ts`.
//!
//! In-degree of an executable node is the count of distinct executable
//! predecessors, while each outgoing connection decrements that count once.
//! Two edges between the same pair therefore drive the degree negative. That
//! matches the TypeScript engine.

use std::collections::{HashMap, HashSet, VecDeque};

use serde_json::Value;

use crate::error::EngineError;
use crate::jsonutil::js_truthy;
use crate::types::{WorkflowConnection, WorkflowNode};

pub struct PreparedGraph {
    pub indegree: HashMap<String, i32>,
    pub adjacency: HashMap<String, Vec<WorkflowConnection>>,
    pub node_map: HashMap<String, WorkflowNode>,
    pub start_nodes: Vec<String>,
}

pub struct Walk {
    pub indegree: HashMap<String, i32>,
    pub adjacency: HashMap<String, Vec<WorkflowConnection>>,
    pub node_map: HashMap<String, WorkflowNode>,
    pub ready: VecDeque<String>,
    pub executed: HashSet<String>,
    pub queued: HashSet<String>,
}

pub fn prepare(
    nodes: &[WorkflowNode],
    connections: &[WorkflowConnection],
    entry_node_id: Option<&str>,
) -> Result<PreparedGraph, EngineError> {
    let GraphStructures {
        indegree,
        adjacency,
        node_map,
    } = build_structures(nodes, connections);
    validate_nodes_exist(nodes, connections)?;
    let root_nodes = find_root_nodes(nodes, &indegree);

    if root_nodes.is_empty() {
        return Err(EngineError::NoEntryNodes);
    }

    let start_nodes = select_start_nodes(&root_nodes, &node_map, entry_node_id)?;
    let predecessors = predecessor_sets(nodes, connections);
    let executable = executable_nodes(nodes, &start_nodes, &predecessors);
    let indegree = adjusted_indegree(nodes, indegree, &executable, &predecessors);

    Ok(PreparedGraph {
        indegree,
        adjacency,
        node_map,
        start_nodes,
    })
}

pub fn start_walk(prepared: PreparedGraph) -> Walk {
    let queued = prepared.start_nodes.iter().cloned().collect();
    Walk {
        indegree: prepared.indegree,
        adjacency: prepared.adjacency,
        node_map: prepared.node_map,
        ready: prepared.start_nodes.iter().cloned().collect(),
        executed: HashSet::new(),
        queued,
    }
}

/// Pop the next node. `Ok(None)` means the queue is empty.
pub fn shift_ready(walk: &mut Walk) -> Result<Option<WorkflowNode>, EngineError> {
    let Some(current_id) = walk.ready.pop_front() else {
        return Ok(None);
    };
    let Some(node) = walk.node_map.get(&current_id).cloned() else {
        return Err(EngineError::MissingNode {
            node_id: current_id,
        });
    };
    if !walk.executed.insert(current_id.clone()) {
        return Err(EngineError::Cycle {
            node_id: current_id,
            label: node.label,
        });
    }
    Ok(Some(node))
}

pub fn outgoing_connections(
    node: &WorkflowNode,
    all: &[WorkflowConnection],
    node_output: Option<&Value>,
) -> Result<Vec<WorkflowConnection>, EngineError> {
    if node.node_type != "condition" {
        return Ok(all.to_vec());
    }
    let Some(path) = selected_path(node_output) else {
        return Ok(all.to_vec());
    };
    let mut kept = Vec::new();
    for conn in all {
        if handle_missing(&conn.source_handle) {
            return Err(EngineError::ConditionMissingHandle {
                node_id: node.id.clone(),
            });
        }
        let handle = conn.source_handle.as_deref().unwrap_or("");
        if handles_equal(handle, &path) {
            kept.push(conn.clone());
        }
    }
    Ok(kept)
}

pub fn enqueue_successors(
    outgoing: &[WorkflowConnection],
    indegree: &mut HashMap<String, i32>,
    ready: &mut VecDeque<String>,
    queued: &mut HashSet<String>,
) -> Result<(), EngineError> {
    for conn in outgoing {
        let degree = indegree.get(&conn.to_node_id).copied().unwrap_or(0) - 1;
        indegree.insert(conn.to_node_id.clone(), degree);
        if degree == 0 {
            ready.push_back(conn.to_node_id.clone());
            queued.insert(conn.to_node_id.clone());
        } else if degree < 0 {
            return Err(EngineError::NegativeIndegree {
                node_id: conn.to_node_id.clone(),
            });
        }
    }
    Ok(())
}

pub fn unfinished_message(
    nodes: &[WorkflowNode],
    queued: &HashSet<String>,
    executed: &HashSet<String>,
) -> Option<String> {
    if executed.len() >= queued.len() {
        return None;
    }
    let labels = nodes
        .iter()
        .filter(|node| queued.contains(&node.id) && !executed.contains(&node.id))
        .map(|node| format!("{} ({})", node.label, node.id))
        .collect::<Vec<_>>()
        .join(", ");
    let count = queued.len() - executed.len();
    Some(EngineError::Incomplete { count, labels }.to_string())
}

struct GraphStructures {
    indegree: HashMap<String, i32>,
    adjacency: HashMap<String, Vec<WorkflowConnection>>,
    node_map: HashMap<String, WorkflowNode>,
}

fn build_structures(nodes: &[WorkflowNode], connections: &[WorkflowConnection]) -> GraphStructures {
    let mut indegree = HashMap::new();
    let mut adjacency = HashMap::new();
    let mut node_map = HashMap::new();
    for node in nodes {
        indegree.insert(node.id.clone(), 0);
        adjacency.insert(node.id.clone(), Vec::new());
        node_map.insert(node.id.clone(), node.clone());
    }
    for conn in connections {
        *indegree.entry(conn.to_node_id.clone()).or_insert(0) += 1;
        if let Some(list) = adjacency.get_mut(&conn.from_node_id) {
            list.push(conn.clone());
        }
    }
    GraphStructures {
        indegree,
        adjacency,
        node_map,
    }
}

fn validate_nodes_exist(
    nodes: &[WorkflowNode],
    connections: &[WorkflowConnection],
) -> Result<(), EngineError> {
    let node_ids: HashSet<&str> = nodes.iter().map(|node| node.id.as_str()).collect();
    for conn in connections {
        if !node_ids.contains(conn.from_node_id.as_str()) {
            return Err(EngineError::DanglingFrom {
                from_node_id: conn.from_node_id.clone(),
            });
        }
        if !node_ids.contains(conn.to_node_id.as_str()) {
            return Err(EngineError::DanglingTo {
                to_node_id: conn.to_node_id.clone(),
            });
        }
    }
    Ok(())
}

fn find_root_nodes(nodes: &[WorkflowNode], indegree: &HashMap<String, i32>) -> Vec<String> {
    let mut seen = HashSet::new();
    let mut roots = Vec::new();
    for node in nodes {
        if seen.insert(node.id.clone()) && indegree.get(&node.id).copied().unwrap_or(0) == 0 {
            roots.push(node.id.clone());
        }
    }
    roots
}

fn select_start_nodes(
    root_nodes: &[String],
    node_map: &HashMap<String, WorkflowNode>,
    entry_node_id: Option<&str>,
) -> Result<Vec<String>, EngineError> {
    if let Some(entry_node_id) = entry_node_id.filter(|id| !id.is_empty()) {
        if !root_nodes.iter().any(|id| id == entry_node_id) {
            return Err(EngineError::InvalidEntry {
                entry_node_id: entry_node_id.to_string(),
            });
        }
        return Ok(vec![entry_node_id.to_string()]);
    }
    if root_nodes.len() > 1 {
        let labels = root_nodes
            .iter()
            .filter_map(|id| node_map.get(id))
            .map(|node| format!("{} ({})", node.label, node.id))
            .collect::<Vec<_>>()
            .join(", ");
        return Err(EngineError::MultipleEntries { labels });
    }
    Ok(root_nodes.to_vec())
}

fn predecessor_sets(
    nodes: &[WorkflowNode],
    connections: &[WorkflowConnection],
) -> HashMap<String, HashSet<String>> {
    let mut predecessors: HashMap<String, HashSet<String>> = HashMap::new();
    for node in nodes {
        predecessors.entry(node.id.clone()).or_default();
    }
    for conn in connections {
        if let Some(preds) = predecessors.get_mut(&conn.to_node_id) {
            preds.insert(conn.from_node_id.clone());
        }
    }
    predecessors
}

fn executable_nodes(
    nodes: &[WorkflowNode],
    start_nodes: &[String],
    predecessors: &HashMap<String, HashSet<String>>,
) -> HashSet<String> {
    let mut executable: HashSet<String> = start_nodes.iter().cloned().collect();
    let mut changed = true;
    while changed {
        changed = false;
        for node in nodes {
            if executable.contains(&node.id) {
                continue;
            }
            let Some(preds) = predecessors.get(&node.id) else {
                continue;
            };
            if preds.is_empty() {
                continue;
            }
            if preds.iter().any(|pred| executable.contains(pred)) {
                executable.insert(node.id.clone());
                changed = true;
            }
        }
    }
    executable
}

fn adjusted_indegree(
    nodes: &[WorkflowNode],
    mut indegree: HashMap<String, i32>,
    executable: &HashSet<String>,
    predecessors: &HashMap<String, HashSet<String>>,
) -> HashMap<String, i32> {
    for node in nodes {
        if !executable.contains(&node.id) {
            continue;
        }
        let count = predecessors.get(&node.id).map_or(0, |preds| {
            preds
                .iter()
                .filter(|pred| executable.contains(*pred))
                .count()
        });
        let count = i32::try_from(count).unwrap_or(i32::MAX);
        indegree.insert(node.id.clone(), count);
    }
    indegree
}

fn selected_path(node_output: Option<&Value>) -> Option<Value> {
    let output = node_output?;
    if !output.is_object() {
        return None;
    }
    let path = output.get("path")?;
    if js_truthy(path) {
        Some(path.clone())
    } else {
        None
    }
}

fn handle_missing(handle: &Option<String>) -> bool {
    match handle {
        None => true,
        Some(text) if text.is_empty() => true,
        Some(_) => false,
    }
}

fn handles_equal(handle: &str, path: &Value) -> bool {
    match path {
        Value::String(text) => text == handle,
        _ => false,
    }
}
