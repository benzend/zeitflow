//! Print `zf-core` replay results for every JSON fixture in a directory.
//!
//! The TypeScript harness runs the same files through `lib/workflow-engine.ts`
//! and compares the two JSON documents. This binary does not touch a database.

use std::path::PathBuf;
use std::process::ExitCode;

use serde::Deserialize;
use serde_json::{Map, Value};
use zf_core::{ReplayInput, ReplayResult, WorkflowConnection, WorkflowNode};

fn main() -> ExitCode {
    tracing_subscriber::fmt()
        .with_writer(std::io::stderr)
        .with_ansi(false)
        .with_target(false)
        .init();

    match run() {
        Ok(()) => ExitCode::SUCCESS,
        Err(message) => {
            eprintln!("{message}");
            ExitCode::from(1)
        }
    }
}

fn run() -> Result<(), String> {
    let mut args = std::env::args().skip(1);
    let Some(first) = args.next() else {
        return Err(
            "usage: zf-parity <fixtures-dir> | zf-parity --substitute <cases.json>".to_string(),
        );
    };
    if first == "--substitute" {
        let Some(path) = args.next() else {
            return Err("usage: zf-parity --substitute <cases.json>".to_string());
        };
        return substitute_file(&path);
    }
    let dir = first;

    let mut paths = Vec::new();
    let entries = std::fs::read_dir(&dir).map_err(|err| format!("read {dir}: {err}"))?;
    for entry in entries {
        let entry = entry.map_err(|err| err.to_string())?;
        let path = entry.path();
        let is_json = path.extension().and_then(|ext| ext.to_str()) == Some("json");
        let name = path
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("");
        if is_json && !name.starts_with('_') && !name.starts_with('.') {
            paths.push(path);
        }
    }
    paths.sort();

    let mut results = Vec::new();
    for path in paths {
        results.push(replay_file(&path)?);
    }

    let payload = serde_json::json!({ "results": results });
    serde_json::to_writer(std::io::stdout(), &payload).map_err(|err| err.to_string())?;
    println!();
    Ok(())
}

fn substitute_file(path: &str) -> Result<(), String> {
    let text = std::fs::read_to_string(path).map_err(|err| format!("{path}: {err}"))?;
    let cases: Vec<SubstituteCase> =
        serde_json::from_str(&text).map_err(|err| format!("{path}: {err}"))?;
    let mut results = Vec::with_capacity(cases.len());
    for case in cases {
        let output = zf_core::substitute_variables(&case.template, &case.variables);
        results.push(SubstituteOutput {
            id: case.id,
            output,
        });
    }
    let payload = serde_json::json!({ "results": results });
    serde_json::to_writer(std::io::stdout(), &payload).map_err(|err| err.to_string())?;
    println!();
    Ok(())
}

fn replay_file(path: &PathBuf) -> Result<NamedResult, String> {
    let text = std::fs::read_to_string(path).map_err(|err| format!("{}: {err}", path.display()))?;
    let fixture: FixtureFile =
        serde_json::from_str(&text).map_err(|err| format!("{}: {err}", path.display()))?;
    let name = fixture.name.clone().unwrap_or_else(|| {
        path.file_stem()
            .and_then(|stem| stem.to_str())
            .unwrap_or("fixture")
            .to_string()
    });
    let input = normalize(fixture)?;
    let result = zf_core::replay(&input);
    Ok(NamedResult { name, result })
}

fn normalize(fixture: FixtureFile) -> Result<ReplayInput, String> {
    let mut nodes = Vec::with_capacity(fixture.nodes.len());
    for node in fixture.nodes {
        nodes.push(WorkflowNode {
            id: node.id,
            node_type: node.node_type,
            label: node.label,
            entry_type: node.entry_type,
            config: config_to_string(node.config)?,
        });
    }
    let entry_node_id = fixture.entry_node_id.filter(|id| !id.is_empty());
    let input_data = if fixture.input_data.is_null() {
        Value::Object(Map::new())
    } else {
        fixture.input_data
    };
    Ok(ReplayInput {
        nodes,
        connections: fixture.connections,
        input_data,
        entry_node_id,
        outputs: fixture.outputs,
    })
}

fn config_to_string(config: Option<Value>) -> Result<Option<String>, String> {
    match config {
        None | Some(Value::Null) => Ok(None),
        Some(Value::String(text)) => Ok(Some(text)),
        Some(other) => serde_json::to_string(&other)
            .map(Some)
            .map_err(|err| err.to_string()),
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct FixtureFile {
    name: Option<String>,
    nodes: Vec<LooseNode>,
    connections: Vec<WorkflowConnection>,
    #[serde(default)]
    input_data: Value,
    #[serde(default)]
    entry_node_id: Option<String>,
    #[serde(default)]
    outputs: Map<String, Value>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LooseNode {
    id: String,
    #[serde(rename = "type")]
    node_type: String,
    label: String,
    #[serde(default)]
    entry_type: Option<String>,
    #[serde(default)]
    config: Option<Value>,
}

#[derive(Debug, serde::Serialize)]
struct NamedResult {
    name: String,
    result: ReplayResult,
}

#[derive(Debug, Deserialize)]
struct SubstituteCase {
    id: String,
    template: String,
    variables: Value,
}

#[derive(Debug, serde::Serialize)]
struct SubstituteOutput {
    id: String,
    output: String,
}
