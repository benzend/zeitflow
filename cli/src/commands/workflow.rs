use anyhow::Result;
use clap::Subcommand;
use serde_json::Value;

use crate::client::ApiClient;
use crate::config::Config;
use crate::output::{self, OutputFormat};

#[derive(Subcommand)]
pub enum WorkflowCommand {
    /// List all workflows
    #[command(alias = "ls")]
    List {
        /// Filter by status: draft, published, archived
        #[arg(long)]
        status: Option<String>,
    },

    /// Get workflow details (includes nodes and connections)
    Get {
        /// Workflow ID
        id: i64,
    },

    /// Create a new workflow
    Create {
        /// Workflow name
        #[arg(long)]
        name: String,

        /// Workflow description
        #[arg(long)]
        description: Option<String>,
    },

    /// Delete a workflow
    #[command(alias = "rm")]
    Delete {
        /// Workflow ID
        id: i64,
    },

    /// Execute a workflow
    Run {
        /// Workflow ID
        id: i64,

        /// Input data as JSON string
        #[arg(long)]
        input: Option<String>,

        /// Specific entry node to trigger
        #[arg(long)]
        entry_node: Option<String>,
    },

    /// Get workflow execution statistics
    Stats {
        /// Workflow ID
        id: i64,
    },

    /// Change workflow status (draft, published, archived)
    Publish {
        /// Workflow ID
        id: i64,

        /// Target status
        #[arg(long, default_value = "published")]
        status: String,
    },

    /// Add a node to a workflow
    #[command(name = "add-node")]
    AddNode {
        /// Workflow ID
        #[arg(long)]
        workflow: i64,

        /// Node type: entry, ai, email, slack, sms, telegram, youtube, condition, scheduler, review
        #[arg(long, name = "type")]
        node_type: String,

        /// Node label
        #[arg(long)]
        label: String,

        /// X position (default: 0)
        #[arg(long, default_value = "250")]
        x: f64,

        /// Y position (default: 0)
        #[arg(long, default_value = "200")]
        y: f64,

        /// Node config as JSON (type-specific, e.g. '{"model":"google/gemini-2.0-flash-001","systemPrompt":"...","userPrompt":"...","outputType":"text","outputStructure":""}')
        #[arg(long)]
        config: Option<String>,

        /// Entry type for entry nodes: api, form, webhook
        #[arg(long)]
        entry_type: Option<String>,
    },

    /// Update a node's label, position, config, or entry type
    #[command(name = "update-node")]
    UpdateNode {
        /// Workflow ID
        #[arg(long)]
        workflow: i64,

        /// Node ID to update
        #[arg(long)]
        node: String,

        /// New label
        #[arg(long)]
        label: Option<String>,

        /// New X position
        #[arg(long)]
        x: Option<f64>,

        /// New Y position
        #[arg(long)]
        y: Option<f64>,

        /// New config as JSON (type-specific, replaces existing config)
        #[arg(long)]
        config: Option<String>,

        /// New entry type for entry nodes: api, form, webhook
        #[arg(long)]
        entry_type: Option<String>,

        /// Entry fields as JSON array (e.g. '[{"key":"name","name":"Name","type":"text"}]')
        #[arg(long)]
        fields: Option<String>,
    },

    /// List nodes in a workflow
    #[command(name = "list-nodes", alias = "nodes")]
    ListNodes {
        /// Workflow ID
        id: i64,
    },

    /// Remove a node from a workflow
    #[command(name = "remove-node")]
    RemoveNode {
        /// Workflow ID
        #[arg(long)]
        workflow: i64,

        /// Node ID to remove
        #[arg(long)]
        node: String,
    },

    /// Connect two nodes in a workflow
    Connect {
        /// Workflow ID
        #[arg(long)]
        workflow: i64,

        /// Source node ID
        #[arg(long)]
        from: String,

        /// Target node ID
        #[arg(long)]
        to: String,

        /// Source handle (e.g. "true" or "false" for condition nodes)
        #[arg(long)]
        source_handle: Option<String>,
    },

    /// Validate a workflow for common issues
    Validate {
        /// Workflow ID
        id: i64,
    },

    /// Generate a workflow from a natural language description
    Generate {
        /// Description of the workflow to create
        description: String,

        /// AI model to use
        #[arg(long, default_value = "google/gemini-2.0-flash-001")]
        model: String,

        /// Existing workflow ID to modify (creates new if omitted)
        #[arg(long)]
        workflow: Option<i64>,
    },

    /// Open a workflow in the browser
    Open {
        /// Workflow ID
        id: i64,
    },

    /// Visualize a workflow as an ASCII graph
    #[command(alias = "viz")]
    Visualize {
        /// Workflow ID
        id: i64,
    },
}

pub async fn run(
    action: WorkflowCommand,
    format: OutputFormat,
    api_url: Option<String>,
) -> Result<()> {
    let mut config = Config::load()?;
    if let Some(url) = api_url {
        config.url = Some(url);
    }
    let client = ApiClient::new(&config)?;

    match action {
        WorkflowCommand::List { status } => {
            let mut path = "/api/workflows".to_string();
            if let Some(s) = &status {
                path = format!("{path}?status={s}");
            }
            let workflows: Value = client.get(&path).await?;

            match format {
                OutputFormat::Json => output::print_json(&workflows, format),
                OutputFormat::Text => {
                    let items = workflows
                        .as_object()
                        .and_then(|o| o.get("workflows"))
                        .and_then(|w| w.as_array())
                        .or_else(|| workflows.as_array())
                        .cloned()
                        .unwrap_or_default();

                    let rows: Vec<Vec<String>> = items
                        .iter()
                        .map(|w| {
                            vec![
                                w["id"].to_string(),
                                w["name"]
                                    .as_str()
                                    .unwrap_or("(unnamed)")
                                    .to_string(),
                                w["status"]
                                    .as_str()
                                    .unwrap_or("unknown")
                                    .to_string(),
                                w["executionCount"].to_string(),
                            ]
                        })
                        .collect();

                    output::print_table(&["ID", "NAME", "STATUS", "RUNS"], &rows);
                }
            }
            Ok(())
        }

        WorkflowCommand::Get { id } => {
            let workflow: Value = client.get(&format!("/api/workflow/{id}")).await?;
            output::print_json(&workflow, format);
            Ok(())
        }

        WorkflowCommand::Create { name, description } => {
            let mut body = serde_json::json!({ "name": name });
            if let Some(desc) = description {
                body["description"] = Value::String(desc);
            }
            let result: Value = client.post("/api/workflows", &body).await?;

            match format {
                OutputFormat::Json => output::print_json(&result, format),
                OutputFormat::Text => {
                    let id = result
                        .get("workflow")
                        .and_then(|w| w.get("id"))
                        .unwrap_or(&result["id"]);
                    output::print_success(&format!("Workflow created (id: {id})"));
                }
            }
            Ok(())
        }

        WorkflowCommand::Delete { id } => {
            let result = client.delete(&format!("/api/workflow/{id}")).await?;
            match format {
                OutputFormat::Json => output::print_json(&result, format),
                OutputFormat::Text => {
                    output::print_success(&format!("Workflow {id} deleted"));
                }
            }
            Ok(())
        }

        WorkflowCommand::Run { id, input, entry_node } => {
            let mut body = serde_json::json!({});
            if let Some(input_str) = input {
                let input_data: Value = serde_json::from_str(&input_str)
                    .map_err(|e| anyhow::anyhow!("Invalid JSON input: {e}"))?;
                body["inputData"] = input_data;
            }
            if let Some(node_id) = entry_node {
                body["entryNodeId"] = Value::String(node_id);
            }

            let result: Value = client
                .post(&format!("/api/workflow/{id}/execute"), &body)
                .await?;

            match format {
                OutputFormat::Json => output::print_json(&result, format),
                OutputFormat::Text => {
                    let exec_id = &result["executionId"];
                    let success = result["success"].as_bool().unwrap_or(false);
                    if success {
                        output::print_success(&format!(
                            "Execution started (id: {exec_id})"
                        ));
                        println!(
                            "  View: zeitflow execution get {exec_id}"
                        );
                    } else {
                        output::print_error("Execution failed to start");
                        println!("  {result}");
                    }
                }
            }
            Ok(())
        }

        WorkflowCommand::Stats { id } => {
            let stats: Value = client
                .get(&format!("/api/workflow/{id}/stats"))
                .await?;
            output::print_json(&stats, format);
            Ok(())
        }

        WorkflowCommand::Publish { id, status } => {
            let valid = ["draft", "published", "archived"];
            if !valid.contains(&status.as_str()) {
                anyhow::bail!(
                    "Invalid status '{status}'. Must be one of: {}",
                    valid.join(", ")
                );
            }

            let body = serde_json::json!({ "status": status });
            let result: Value = client
                .put(&format!("/api/workflow/{id}"), &body)
                .await?;

            match format {
                OutputFormat::Json => output::print_json(&result, format),
                OutputFormat::Text => {
                    output::print_success(&format!(
                        "Workflow {id} status changed to '{status}'"
                    ));
                }
            }
            Ok(())
        }

        WorkflowCommand::AddNode {
            workflow,
            node_type,
            label,
            x,
            y,
            config: node_config,
            entry_type,
        } => {
            if !crate::generated::VALID_NODE_TYPES.contains(&node_type.as_str()) {
                anyhow::bail!(
                    "Invalid node type '{node_type}'. Must be one of: {}",
                    crate::generated::VALID_NODE_TYPES.join(", ")
                );
            }

            // Fetch existing workflow to get current nodes/connections
            let existing: Value = client
                .get(&format!("/api/workflow/{workflow}"))
                .await?;
            let mut nodes: Vec<Value> = existing
                .get("nodes")
                .and_then(|n| n.as_array())
                .cloned()
                .unwrap_or_default();
            let connections: Vec<Value> = existing
                .get("connections")
                .and_then(|c| c.as_array())
                .cloned()
                .unwrap_or_default();

            // Generate a node ID
            let node_id = format!(
                "{node_type}_{}",
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_millis()
            );

            // Build the new node
            let mut new_node = serde_json::json!({
                "id": node_id,
                "type": node_type,
                "x": x,
                "y": y,
                "label": label,
            });

            // Add entry type for entry nodes
            if node_type == "entry" {
                new_node["entryType"] = Value::String(
                    entry_type.unwrap_or_else(|| "form".to_string()),
                );
            }

            // Merge type-specific config
            if let Some(cfg_str) = node_config {
                let cfg: Value = serde_json::from_str(&cfg_str)
                    .map_err(|e| anyhow::anyhow!("Invalid config JSON: {e}"))?;
                let config_key = format!("{node_type}Config");
                new_node[config_key] = cfg;
            }

            nodes.push(new_node);

            // Re-map existing nodes to the save format
            let save_nodes: Vec<Value> = nodes
                .iter()
                .map(|n| remap_node_for_save(n))
                .collect();

            let save_connections: Vec<Value> = connections
                .iter()
                .map(|c| {
                    serde_json::json!({
                        "from": c.get("fromNodeId").or_else(|| c.get("from"))
                            .and_then(|v| v.as_str()).unwrap_or(""),
                        "to": c.get("toNodeId").or_else(|| c.get("to"))
                            .and_then(|v| v.as_str()).unwrap_or(""),
                        "sourceHandle": c.get("sourceHandle").cloned().unwrap_or(Value::Null),
                        "targetHandle": c.get("targetHandle").cloned().unwrap_or(Value::Null),
                    })
                })
                .collect();

            let body = serde_json::json!({
                "nodes": save_nodes,
                "connections": save_connections,
            });

            let result: Value = client
                .post(&format!("/api/workflow/{workflow}"), &body)
                .await?;

            match format {
                OutputFormat::Json => {
                    let out = serde_json::json!({
                        "success": result.get("success").cloned().unwrap_or(Value::Bool(true)),
                        "nodeId": node_id,
                    });
                    output::print_json(&out, format);
                }
                OutputFormat::Text => {
                    output::print_success(&format!(
                        "Node '{label}' added (id: {node_id})"
                    ));
                }
            }
            Ok(())
        }

        WorkflowCommand::UpdateNode {
            workflow,
            node,
            label: new_label,
            x: new_x,
            y: new_y,
            config: new_config,
            entry_type: new_entry_type,
            fields: new_fields,
        } => {
            let existing: Value = client
                .get(&format!("/api/workflow/{workflow}"))
                .await?;
            let nodes: Vec<Value> = existing
                .get("nodes")
                .and_then(|n| n.as_array())
                .cloned()
                .unwrap_or_default();
            let connections: Vec<Value> = existing
                .get("connections")
                .and_then(|c| c.as_array())
                .cloned()
                .unwrap_or_default();

            // Verify node exists
            let found = nodes.iter().any(|n| {
                n.get("id").and_then(|v| v.as_str()) == Some(&node)
            });
            if !found {
                anyhow::bail!("Node '{node}' not found in workflow {workflow}");
            }

            // Remap nodes, applying updates to the target node
            let save_nodes: Vec<Value> = nodes
                .iter()
                .map(|n| {
                    let mut remapped = remap_node_for_save(n);
                    let n_id = n.get("id").and_then(|v| v.as_str()).unwrap_or("");
                    if n_id == node {
                        if let Some(ref l) = new_label {
                            remapped["label"] = Value::String(l.clone());
                        }
                        if let Some(x) = new_x {
                            remapped["x"] = serde_json::json!(x);
                        }
                        if let Some(y) = new_y {
                            remapped["y"] = serde_json::json!(y);
                        }
                        if let Some(ref et) = new_entry_type {
                            remapped["entryType"] = Value::String(et.clone());
                        }
                        if let Some(ref f) = new_fields {
                            if let Ok(fields_val) = serde_json::from_str::<Value>(f) {
                                remapped["fields"] = fields_val;
                            }
                        }
                        if let Some(ref cfg_str) = new_config {
                            if let Ok(cfg) = serde_json::from_str::<Value>(cfg_str) {
                                let node_type = n.get("type")
                                    .and_then(|v| v.as_str())
                                    .unwrap_or("");
                                let config_key = format!("{node_type}Config");
                                remapped[config_key] = cfg;
                            }
                        }
                    }
                    remapped
                })
                .collect();

            let save_connections: Vec<Value> = connections
                .iter()
                .map(|c| {
                    serde_json::json!({
                        "from": c.get("fromNodeId").or_else(|| c.get("from"))
                            .and_then(|v| v.as_str()).unwrap_or(""),
                        "to": c.get("toNodeId").or_else(|| c.get("to"))
                            .and_then(|v| v.as_str()).unwrap_or(""),
                        "sourceHandle": c.get("sourceHandle").cloned().unwrap_or(Value::Null),
                        "targetHandle": c.get("targetHandle").cloned().unwrap_or(Value::Null),
                    })
                })
                .collect();

            let body = serde_json::json!({
                "nodes": save_nodes,
                "connections": save_connections,
            });

            let result: Value = client
                .post(&format!("/api/workflow/{workflow}"), &body)
                .await?;

            match format {
                OutputFormat::Json => {
                    let out = serde_json::json!({
                        "success": result.get("success").cloned().unwrap_or(Value::Bool(true)),
                        "nodeId": node,
                    });
                    output::print_json(&out, format);
                }
                OutputFormat::Text => {
                    output::print_success(&format!(
                        "Node '{node}' updated"
                    ));
                }
            }
            Ok(())
        }

        WorkflowCommand::ListNodes { id } => {
            let workflow: Value = client
                .get(&format!("/api/workflow/{id}"))
                .await?;
            let nodes = workflow
                .get("nodes")
                .and_then(|n| n.as_array())
                .cloned()
                .unwrap_or_default();

            match format {
                OutputFormat::Json => output::print_json(&nodes, format),
                OutputFormat::Text => {
                    let rows: Vec<Vec<String>> = nodes
                        .iter()
                        .map(|n| {
                            vec![
                                n["id"].as_str().unwrap_or("?").to_string(),
                                n["type"].as_str().unwrap_or("?").to_string(),
                                n["label"].as_str().unwrap_or("(unlabeled)").to_string(),
                            ]
                        })
                        .collect();
                    output::print_table(&["ID", "TYPE", "LABEL"], &rows);
                }
            }
            Ok(())
        }

        WorkflowCommand::RemoveNode { workflow, node } => {
            // Fetch existing, filter out the node and its connections
            let existing: Value = client
                .get(&format!("/api/workflow/{workflow}"))
                .await?;
            let nodes: Vec<Value> = existing
                .get("nodes")
                .and_then(|n| n.as_array())
                .cloned()
                .unwrap_or_default();
            let connections: Vec<Value> = existing
                .get("connections")
                .and_then(|c| c.as_array())
                .cloned()
                .unwrap_or_default();

            let save_nodes: Vec<Value> = nodes
                .iter()
                .filter(|n| n["id"].as_str().unwrap_or("") != node)
                .map(|n| remap_node_for_save(n))
                .collect();

            let save_connections: Vec<Value> = connections
                .iter()
                .filter(|c| {
                    let from = c.get("fromNodeId")
                        .or_else(|| c.get("from"))
                        .and_then(|v| v.as_str())
                        .unwrap_or("");
                    let to = c.get("toNodeId")
                        .or_else(|| c.get("to"))
                        .and_then(|v| v.as_str())
                        .unwrap_or("");
                    from != node && to != node
                })
                .map(|c| {
                    serde_json::json!({
                        "from": c.get("fromNodeId").or_else(|| c.get("from"))
                            .and_then(|v| v.as_str()).unwrap_or(""),
                        "to": c.get("toNodeId").or_else(|| c.get("to"))
                            .and_then(|v| v.as_str()).unwrap_or(""),
                        "sourceHandle": c.get("sourceHandle").cloned().unwrap_or(Value::Null),
                        "targetHandle": c.get("targetHandle").cloned().unwrap_or(Value::Null),
                    })
                })
                .collect();

            let body = serde_json::json!({
                "nodes": save_nodes,
                "connections": save_connections,
            });

            let result: Value = client
                .post(&format!("/api/workflow/{workflow}"), &body)
                .await?;

            match format {
                OutputFormat::Json => output::print_json(&result, format),
                OutputFormat::Text => {
                    output::print_success(&format!("Node '{node}' removed"));
                }
            }
            Ok(())
        }

        WorkflowCommand::Connect {
            workflow,
            from,
            to,
            source_handle,
        } => {
            // Fetch existing, add new connection
            let existing: Value = client
                .get(&format!("/api/workflow/{workflow}"))
                .await?;
            let nodes: Vec<Value> = existing
                .get("nodes")
                .and_then(|n| n.as_array())
                .cloned()
                .unwrap_or_default();
            let mut connections: Vec<Value> = existing
                .get("connections")
                .and_then(|c| c.as_array())
                .cloned()
                .unwrap_or_default()
                .iter()
                .map(|c| {
                    serde_json::json!({
                        "from": c.get("fromNodeId").or_else(|| c.get("from"))
                            .and_then(|v| v.as_str()).unwrap_or(""),
                        "to": c.get("toNodeId").or_else(|| c.get("to"))
                            .and_then(|v| v.as_str()).unwrap_or(""),
                        "sourceHandle": c.get("sourceHandle").cloned().unwrap_or(Value::Null),
                        "targetHandle": c.get("targetHandle").cloned().unwrap_or(Value::Null),
                    })
                })
                .collect();

            let mut new_conn = serde_json::json!({
                "from": from,
                "to": to,
            });
            if let Some(handle) = &source_handle {
                new_conn["sourceHandle"] = Value::String(handle.clone());
            }
            connections.push(new_conn);

            let save_nodes: Vec<Value> = nodes
                .iter()
                .map(|n| remap_node_for_save(n))
                .collect();

            let body = serde_json::json!({
                "nodes": save_nodes,
                "connections": connections,
            });

            let result: Value = client
                .post(&format!("/api/workflow/{workflow}"), &body)
                .await?;

            match format {
                OutputFormat::Json => output::print_json(&result, format),
                OutputFormat::Text => {
                    let arrow = if let Some(h) = &source_handle {
                        format!("{from} --[{h}]--> {to}")
                    } else {
                        format!("{from} --> {to}")
                    };
                    output::print_success(&format!("Connected: {arrow}"));
                }
            }
            Ok(())
        }

        WorkflowCommand::Validate { id } => {
            let existing: Value = client
                .get(&format!("/api/workflow/{id}"))
                .await?;
            let nodes: Vec<Value> = existing
                .get("nodes")
                .and_then(|n| n.as_array())
                .cloned()
                .unwrap_or_default();
            let connections: Vec<Value> = existing
                .get("connections")
                .and_then(|c| c.as_array())
                .cloned()
                .unwrap_or_default();

            let issues = validate_workflow(&nodes, &connections);

            match format {
                OutputFormat::Json => {
                    let out = serde_json::json!({
                        "valid": issues.is_empty(),
                        "issueCount": issues.len(),
                        "issues": issues.iter().map(|i| serde_json::json!({
                            "level": i.level,
                            "node": i.node_id,
                            "message": i.message,
                        })).collect::<Vec<_>>(),
                    });
                    output::print_json(&out, format);
                }
                OutputFormat::Text => {
                    if issues.is_empty() {
                        output::print_success("Workflow is valid — no issues found");
                    } else {
                        let errors = issues.iter().filter(|i| i.level == "error").count();
                        let warnings = issues.iter().filter(|i| i.level == "warning").count();
                        eprintln!("Found {} issue(s): {} error(s), {} warning(s)\n",
                            issues.len(), errors, warnings);
                        for issue in &issues {
                            let icon = if issue.level == "error" { "✗" } else { "⚠" };
                            let node_str = issue.node_id.as_deref().unwrap_or("workflow");
                            eprintln!("  {icon} [{node_str}] {}", issue.message);
                        }
                        if errors > 0 {
                            std::process::exit(1);
                        }
                    }
                }
            }
            Ok(())
        }

        WorkflowCommand::Open { id } => {
            let url = format!("{}/workflow/{id}/edit", config.url());
            eprintln!("Opening {} in your browser...", url);
            open::that(&url).map_err(|e| anyhow::anyhow!("Failed to open browser: {e}"))?;
            output::print_success(&format!("Opened workflow {id} in browser"));
            Ok(())
        }

        WorkflowCommand::Visualize { id } => {
            let workflow: Value = client.get(&format!("/api/workflow/{id}")).await?;
            let nodes: Vec<Value> = workflow
                .get("nodes")
                .and_then(|n| n.as_array())
                .cloned()
                .unwrap_or_default();
            let connections: Vec<Value> = workflow
                .get("connections")
                .and_then(|c| c.as_array())
                .cloned()
                .unwrap_or_default();

            match format {
                OutputFormat::Json => {
                    let graph = build_viz_json(&nodes, &connections);
                    output::print_json(&graph, format);
                }
                OutputFormat::Text => {
                    let name = workflow
                        .get("name")
                        .and_then(|v| v.as_str())
                        .unwrap_or("Untitled");
                    print_workflow_graph(name, &nodes, &connections);
                }
            }
            Ok(())
        }

        WorkflowCommand::Generate { description, model, workflow } => {
            let mut body = serde_json::json!({
                "prompt": description,
                "model": model,
            });
            if let Some(wf_id) = workflow {
                body["workflowId"] = Value::Number(wf_id.into());
            }

            let result: Value = client
                .post("/api/chat/workflow", &body)
                .await?;

            match format {
                OutputFormat::Json => output::print_json(&result, format),
                OutputFormat::Text => {
                    if let Some(response) = result["response"].as_str() {
                        println!("{response}");
                    }
                    if let Some(proposed) = result.get("proposedWorkflow") {
                        if !proposed.is_null() {
                            let node_count = proposed
                                .get("nodes")
                                .and_then(|n| n.as_array())
                                .map(|a| a.len())
                                .unwrap_or(0);
                            let conn_count = proposed
                                .get("connections")
                                .and_then(|c| c.as_array())
                                .map(|a| a.len())
                                .unwrap_or(0);
                            println!(
                                "\nProposed workflow: {node_count} nodes, {conn_count} connections"
                            );
                            println!("Use --output json to see the full structure.");
                        }
                    }
                    if let Some(thread_id) = result.get("threadId") {
                        println!("\nThread ID: {thread_id} (use to continue conversation)");
                    }
                }
            }
            Ok(())
        }
    }
}

/// Remap a node from the GET response format to the POST save format.
/// The GET response has `positionX`/`positionY` and `config` as a JSON string,
/// while the POST expects `x`/`y` and config properties inline.
fn remap_node_for_save(n: &Value) -> Value {
    let mut node = serde_json::json!({
        "id": n.get("id").and_then(|v| v.as_str()).unwrap_or(""),
        "type": n.get("type").and_then(|v| v.as_str()).unwrap_or(""),
        "label": n.get("label").and_then(|v| v.as_str()).unwrap_or(""),
        "x": n.get("x")
            .or_else(|| n.get("positionX"))
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0),
        "y": n.get("y")
            .or_else(|| n.get("positionY"))
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0),
    });

    // Copy entry type if present
    if let Some(et) = n.get("entryType").and_then(|v| v.as_str()) {
        node["entryType"] = Value::String(et.to_string());
    }

    // Copy fields if present (entry nodes)
    if let Some(fields) = n.get("fields") {
        if !fields.is_null() {
            node["fields"] = fields.clone();
        }
    }

    // Parse config JSON string if it exists (from GET response).
    // The stored config is e.g. {"aiConfig": {"model": "..."}}, so we spread
    // its keys directly into the node to match the save format.
    if let Some(config_str) = n.get("config").and_then(|v| v.as_str()) {
        if let Ok(config_val) = serde_json::from_str::<Value>(config_str) {
            if let Some(obj) = config_val.as_object() {
                for (k, v) in obj {
                    node[k] = v.clone();
                }
            }
        }
    }

    // Copy inline config keys if they already exist (from add-node)
    for key in crate::generated::ALL_CONFIG_KEYS {
        if let Some(val) = n.get(key) {
            if !val.is_null() {
                node[key] = val.clone();
            }
        }
    }

    node
}

// ---------------------------------------------------------------------------
// Workflow validation
// ---------------------------------------------------------------------------

struct ValidationIssue {
    level: &'static str, // "error" or "warning"
    node_id: Option<String>,
    message: String,
}

/// Convert a node label to the snake_case variable name used in interpolation.
fn label_to_var_name(label: &str) -> String {
    let mut result = String::new();
    for ch in label.chars() {
        if ch.is_alphanumeric() {
            result.push(ch.to_ascii_lowercase());
        } else if !result.is_empty() && !result.ends_with('_') {
            result.push('_');
        }
    }
    result.trim_end_matches('_').to_string()
}

/// Extract all `{{...}}` variable references from a string.
/// Returns vec of (full_ref, root_name) e.g. ("entry.name", "entry").
fn extract_var_refs(s: &str) -> Vec<(String, String)> {
    let mut refs = Vec::new();
    let mut start = 0;
    while let Some(open) = s[start..].find("{{") {
        let abs_open = start + open + 2;
        if let Some(close) = s[abs_open..].find("}}") {
            let var = s[abs_open..abs_open + close].trim().to_string();
            let root = var.split('.').next().unwrap_or("").to_string();
            if !root.is_empty() {
                refs.push((var, root));
            }
            start = abs_open + close + 2;
        } else {
            break;
        }
    }
    refs
}

fn validate_workflow(nodes: &[Value], connections: &[Value]) -> Vec<ValidationIssue> {
    let mut issues = Vec::new();

    if nodes.is_empty() {
        issues.push(ValidationIssue {
            level: "error",
            node_id: None,
            message: "Workflow has no nodes".into(),
        });
        return issues;
    }

    // Build lookup structures
    let node_map: std::collections::HashMap<&str, &Value> = nodes
        .iter()
        .filter_map(|n| n.get("id").and_then(|v| v.as_str()).map(|id| (id, n)))
        .collect();

    // node label -> var name mapping
    let label_var_map: std::collections::HashMap<&str, String> = nodes
        .iter()
        .filter_map(|n| {
            let id = n.get("id").and_then(|v| v.as_str())?;
            let label = n.get("label").and_then(|v| v.as_str()).unwrap_or(id);
            Some((id, label_to_var_name(label)))
        })
        .collect();

    // All var names that exist as nodes
    let all_var_names: std::collections::HashSet<String> =
        label_var_map.values().cloned().collect();

    // Adjacency: incoming and outgoing per node
    let mut incoming: std::collections::HashMap<&str, Vec<&Value>> = std::collections::HashMap::new();
    let mut outgoing: std::collections::HashMap<&str, Vec<&Value>> = std::collections::HashMap::new();
    for n in nodes {
        if let Some(id) = n.get("id").and_then(|v| v.as_str()) {
            incoming.entry(id).or_default();
            outgoing.entry(id).or_default();
        }
    }
    for c in connections {
        let from = c.get("fromNodeId").or_else(|| c.get("from")).and_then(|v| v.as_str()).unwrap_or("");
        let to = c.get("toNodeId").or_else(|| c.get("to")).and_then(|v| v.as_str()).unwrap_or("");
        if !from.is_empty() && !to.is_empty() {
            incoming.entry(to).or_default().push(c);
            outgoing.entry(from).or_default().push(c);
        }
    }

    // Find entry/root nodes
    let entry_nodes: Vec<&str> = nodes
        .iter()
        .filter_map(|n| {
            let id = n.get("id").and_then(|v| v.as_str())?;
            if incoming.get(id).map_or(true, |v| v.is_empty()) {
                Some(id)
            } else {
                None
            }
        })
        .collect();

    if entry_nodes.is_empty() {
        issues.push(ValidationIssue {
            level: "error",
            node_id: None,
            message: "No entry points found — all nodes have incoming connections (possible cycle)".into(),
        });
        return issues;
    }

    // BFS to find reachable nodes from entry points
    let mut reachable: std::collections::HashSet<&str> = std::collections::HashSet::new();
    let mut queue: std::collections::VecDeque<&str> = entry_nodes.iter().copied().collect();
    while let Some(id) = queue.pop_front() {
        if !reachable.insert(id) {
            continue;
        }
        for c in outgoing.get(id).unwrap_or(&vec![]) {
            let to = c.get("toNodeId").or_else(|| c.get("to")).and_then(|v| v.as_str()).unwrap_or("");
            if !to.is_empty() && !reachable.contains(to) {
                queue.push_back(to);
            }
        }
    }

    // BFS upstream ancestors for a given node
    let ancestors_of = |node_id: &str| -> std::collections::HashSet<String> {
        let mut visited = std::collections::HashSet::new();
        let mut q: std::collections::VecDeque<&str> = std::collections::VecDeque::new();
        for c in incoming.get(node_id).unwrap_or(&vec![]) {
            let from = c.get("fromNodeId").or_else(|| c.get("from")).and_then(|v| v.as_str()).unwrap_or("");
            if !from.is_empty() && visited.insert(from.to_string()) {
                q.push_back(from);
            }
        }
        while let Some(cur) = q.pop_front() {
            for c in incoming.get(cur).unwrap_or(&vec![]) {
                let from = c.get("fromNodeId").or_else(|| c.get("from")).and_then(|v| v.as_str()).unwrap_or("");
                if !from.is_empty() && visited.insert(from.to_string()) {
                    q.push_back(from);
                }
            }
        }
        visited
    };

    // Check each node
    for n in nodes {
        let id = match n.get("id").and_then(|v| v.as_str()) {
            Some(id) => id,
            None => continue,
        };
        let node_type = n.get("type").and_then(|v| v.as_str()).unwrap_or("");
        let label = n.get("label").and_then(|v| v.as_str()).unwrap_or(id);
        let config_str = n.get("config").and_then(|v| v.as_str()).unwrap_or("{}");
        let config: Value = serde_json::from_str(config_str).unwrap_or_default();

        // 1. Unreachable nodes
        if !reachable.contains(id) {
            issues.push(ValidationIssue {
                level: "error",
                node_id: Some(format!("{label} ({id})")),
                message: "Node is unreachable from any entry point".into(),
            });
            continue; // Skip further checks for unreachable nodes
        }

        // 2. Entry node: missing fields
        if node_type == "entry" {
            let fields = config.get("fields").and_then(|f| f.as_array());
            if fields.map_or(true, |f| f.is_empty()) {
                issues.push(ValidationIssue {
                    level: "error",
                    node_id: Some(format!("{label} ({id})")),
                    message: "Entry node has no input fields defined".into(),
                });
            }
        }

        // 3. AI node: missing prompts
        if node_type == "ai" {
            let ai_config = config.get("aiConfig").unwrap_or(&Value::Null);
            let user_prompt = ai_config.get("userPrompt").and_then(|v| v.as_str()).unwrap_or("");
            if user_prompt.is_empty() {
                issues.push(ValidationIssue {
                    level: "error",
                    node_id: Some(format!("{label} ({id})")),
                    message: "AI node has no user prompt".into(),
                });
            }
        }

        // 4. Email node: missing recipients
        if node_type == "email" {
            let email_config = config.get("emailConfig").unwrap_or(&Value::Null);
            let to = email_config.get("to").and_then(|v| v.as_array());
            let has_recipients = to.map_or(false, |arr| {
                arr.iter().any(|r| !r.as_str().unwrap_or("").is_empty())
            });
            if !has_recipients {
                issues.push(ValidationIssue {
                    level: "warning",
                    node_id: Some(format!("{label} ({id})")),
                    message: "Email node has no recipients — users will need to configure this".into(),
                });
            }
        }

        // 5. Condition node: missing sourceHandle on outgoing connections
        if node_type == "condition" {
            let empty_conn_vec: Vec<&Value> = vec![];
            let out = outgoing.get(id).unwrap_or(&empty_conn_vec);
            if out.is_empty() {
                issues.push(ValidationIssue {
                    level: "error",
                    node_id: Some(format!("{label} ({id})")),
                    message: "Condition node has no outgoing connections".into(),
                });
            } else {
                for c in out {
                    let handle = c.get("sourceHandle").and_then(|v| v.as_str()).unwrap_or("");
                    if handle.is_empty() {
                        let to = c.get("toNodeId").or_else(|| c.get("to"))
                            .and_then(|v| v.as_str()).unwrap_or("?");
                        issues.push(ValidationIssue {
                            level: "error",
                            node_id: Some(format!("{label} ({id})")),
                            message: format!("Outgoing connection to {to} is missing sourceHandle ('true' or 'false')"),
                        });
                    }
                }
            }
        }

        // 6. Disconnected non-entry nodes (no outgoing AND no incoming — shouldn't happen if reachable, but check outgoing)
        if node_type != "entry" && outgoing.get(id).map_or(true, |v| v.is_empty()) {
            // Terminal node is fine — this is just informational
        }

        // 7. Variable reference validation
        // Collect all string values from this node's config that might contain {{...}}
        let config_json = serde_json::to_string(&config).unwrap_or_default();
        let var_refs = extract_var_refs(&config_json);
        if !var_refs.is_empty() {
            let ancestors = ancestors_of(id);
            let ancestor_var_names: std::collections::HashSet<String> = ancestors
                .iter()
                .filter_map(|aid| label_var_map.get(aid.as_str()))
                .cloned()
                .collect();

            for (full_ref, root) in &var_refs {
                if !ancestor_var_names.contains(root) {
                    if all_var_names.contains(root) {
                        issues.push(ValidationIssue {
                            level: "error",
                            node_id: Some(format!("{label} ({id})")),
                            message: format!("{{{{{full_ref}}}}} references node \"{root}\" which exists but is not an upstream ancestor"),
                        });
                    } else {
                        issues.push(ValidationIssue {
                            level: "error",
                            node_id: Some(format!("{label} ({id})")),
                            message: format!("{{{{{full_ref}}}}} references unknown node \"{root}\" — no node with that label exists"),
                        });
                    }
                }
            }

            // Check entry field references specifically
            for (full_ref, root) in &var_refs {
                if root == "entry" {
                    let field_name = full_ref.strip_prefix("entry.").unwrap_or("");
                    if field_name.is_empty() {
                        continue;
                    }
                    // Find ancestor entry nodes and check if the field exists
                    for aid in &ancestors {
                        if let Some(ancestor_node) = node_map.get(aid.as_str()) {
                            let a_type = ancestor_node.get("type").and_then(|v| v.as_str()).unwrap_or("");
                            if a_type == "entry" {
                                let a_config_str = ancestor_node.get("config").and_then(|v| v.as_str()).unwrap_or("{}");
                                let a_config: Value = serde_json::from_str(a_config_str).unwrap_or_default();
                                let fields = a_config.get("fields").and_then(|f| f.as_array());
                                let field_keys: Vec<&str> = fields
                                    .map(|arr| arr.iter().filter_map(|f| f.get("key").and_then(|k| k.as_str())).collect())
                                    .unwrap_or_default();
                                if !field_keys.is_empty() && !field_keys.contains(&field_name) {
                                    issues.push(ValidationIssue {
                                        level: "error",
                                        node_id: Some(format!("{label} ({id})")),
                                        message: format!(
                                            "{{{{{full_ref}}}}} references field \"{field_name}\" but entry node only has fields: [{}]",
                                            field_keys.join(", ")
                                        ),
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    issues
}

// ---------------------------------------------------------------------------
// Workflow visualization
// ---------------------------------------------------------------------------

fn build_viz_json(nodes: &[Value], connections: &[Value]) -> Value {
    let graph_nodes: Vec<Value> = nodes
        .iter()
        .map(|n| {
            serde_json::json!({
                "id": n.get("id").and_then(|v| v.as_str()).unwrap_or("?"),
                "type": n.get("type").and_then(|v| v.as_str()).unwrap_or("?"),
                "label": n.get("label").and_then(|v| v.as_str()).unwrap_or("(unlabeled)"),
            })
        })
        .collect();

    let graph_edges: Vec<Value> = connections
        .iter()
        .map(|c| {
            let from = c
                .get("fromNodeId")
                .or_else(|| c.get("from"))
                .and_then(|v| v.as_str())
                .unwrap_or("");
            let to = c
                .get("toNodeId")
                .or_else(|| c.get("to"))
                .and_then(|v| v.as_str())
                .unwrap_or("");
            let handle = c
                .get("sourceHandle")
                .and_then(|v| v.as_str())
                .unwrap_or("");
            let mut edge = serde_json::json!({ "from": from, "to": to });
            if !handle.is_empty() {
                edge["sourceHandle"] = Value::String(handle.to_string());
            }
            edge
        })
        .collect();

    serde_json::json!({
        "nodes": graph_nodes,
        "edges": graph_edges,
    })
}

/// Pretty-print a workflow as a layered ASCII graph using topological ordering.
fn print_workflow_graph(name: &str, nodes: &[Value], connections: &[Value]) {
    use colored::Colorize;

    if nodes.is_empty() {
        println!("  (empty workflow)");
        return;
    }

    // Build node info map
    let node_info: std::collections::HashMap<String, (String, String)> = nodes
        .iter()
        .filter_map(|n| {
            let id = n.get("id").and_then(|v| v.as_str())?.to_string();
            let label = n
                .get("label")
                .and_then(|v| v.as_str())
                .unwrap_or("(unlabeled)")
                .to_string();
            let ntype = n
                .get("type")
                .and_then(|v| v.as_str())
                .unwrap_or("?")
                .to_string();
            Some((id, (label, ntype)))
        })
        .collect();

    // Build adjacency
    let mut children: std::collections::HashMap<String, Vec<(String, String)>> =
        std::collections::HashMap::new();
    let mut in_degree: std::collections::HashMap<String, usize> =
        std::collections::HashMap::new();

    for n in nodes {
        if let Some(id) = n.get("id").and_then(|v| v.as_str()) {
            children.entry(id.to_string()).or_default();
            in_degree.entry(id.to_string()).or_insert(0);
        }
    }

    for c in connections {
        let from = c
            .get("fromNodeId")
            .or_else(|| c.get("from"))
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        let to = c
            .get("toNodeId")
            .or_else(|| c.get("to"))
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        let handle = c
            .get("sourceHandle")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        if !from.is_empty() && !to.is_empty() {
            children
                .entry(from)
                .or_default()
                .push((to.clone(), handle));
            *in_degree.entry(to).or_insert(0) += 1;
        }
    }

    // Topological sort into layers (BFS by level)
    let mut layers: Vec<Vec<String>> = Vec::new();
    let mut queue: std::collections::VecDeque<String> = in_degree
        .iter()
        .filter(|(_, &deg)| deg == 0)
        .map(|(id, _)| id.clone())
        .collect();

    let mut visited: std::collections::HashSet<String> = std::collections::HashSet::new();
    while !queue.is_empty() {
        let mut layer = Vec::new();
        let mut next_queue = std::collections::VecDeque::new();
        while let Some(id) = queue.pop_front() {
            if !visited.insert(id.clone()) {
                continue;
            }
            layer.push(id.clone());
            for (child, _) in children.get(&id).unwrap_or(&vec![]) {
                let deg = in_degree.get_mut(child).unwrap();
                *deg = deg.saturating_sub(1);
                if *deg == 0 {
                    next_queue.push_back(child.clone());
                }
            }
        }
        if !layer.is_empty() {
            layers.push(layer);
        }
        queue = next_queue;
    }

    // Print header
    println!();
    println!("  {}", name.bold().underline());
    println!();

    // Type → icon mapping
    let icon_for = |t: &str| -> &str {
        match t {
            "entry" => ">>",
            "ai" => "AI",
            "email" => "@@",
            "slack" => "##",
            "sms" => "!!",
            "telegram" => "TG",
            "condition" => "??",
            "scheduler" => "CL",
            "review" => "OK",
            "youtube" => "YT",
            _ => "**",
        }
    };

    // Format a node box
    let format_node = |id: &str| -> String {
        let (label, ntype) = node_info
            .get(id)
            .cloned()
            .unwrap_or_else(|| (id.to_string(), "?".to_string()));
        let icon = icon_for(&ntype);
        format!("[{icon} {label}]")
    };

    // Print layers with connections
    for (layer_idx, layer) in layers.iter().enumerate() {
        // Print nodes in this layer
        let node_strs: Vec<String> = layer.iter().map(|id| format_node(id)).collect();
        let layer_line = node_strs.join("    ");
        println!("  {layer_line}");

        // Print connections to next layer
        if layer_idx < layers.len() - 1 {
            let mut arrows: Vec<String> = Vec::new();
            for id in layer {
                for (child, handle) in children.get(id).unwrap_or(&vec![]) {
                    let (parent_label, _) = node_info
                        .get(id)
                        .cloned()
                        .unwrap_or_else(|| (id.clone(), "?".to_string()));
                    let (child_label, _) = node_info
                        .get(child)
                        .cloned()
                        .unwrap_or_else(|| (child.clone(), "?".to_string()));
                    if handle.is_empty() {
                        arrows.push(format!(
                            "  {} → {}",
                            parent_label.dimmed(),
                            child_label
                        ));
                    } else {
                        let handle_display = if handle == "true" {
                            "yes".green().to_string()
                        } else if handle == "false" {
                            "no".red().to_string()
                        } else {
                            handle.to_string()
                        };
                        arrows.push(format!(
                            "  {} —[{}]→ {}",
                            parent_label.dimmed(),
                            handle_display,
                            child_label
                        ));
                    }
                }
            }
            for arrow in &arrows {
                println!("{arrow}");
            }
            println!();
        }
    }

    // Summary
    println!();
    println!(
        "  {} nodes, {} connections",
        nodes.len().to_string().bold(),
        connections.len().to_string().bold()
    );
    println!();
}
