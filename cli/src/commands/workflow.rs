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
            let valid_types = [
                "entry", "ai", "email", "slack", "sms", "telegram",
                "youtube", "condition", "scheduler", "review",
            ];
            if !valid_types.contains(&node_type.as_str()) {
                anyhow::bail!(
                    "Invalid node type '{node_type}'. Must be one of: {}",
                    valid_types.join(", ")
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

    // Parse config JSON string if it exists (from GET response)
    if let Some(config_str) = n.get("config").and_then(|v| v.as_str()) {
        if let Ok(config_val) = serde_json::from_str::<Value>(config_str) {
            let node_type = n.get("type").and_then(|v| v.as_str()).unwrap_or("");
            let config_key = format!("{node_type}Config");
            node[config_key] = config_val;
        }
    }

    // Copy inline config keys if they already exist (from add-node)
    let config_keys = [
        "aiConfig", "emailConfig", "slackConfig", "smsConfig",
        "telegramConfig", "conditionConfig", "youtubeConfig",
        "schedulerConfig", "reviewConfig",
    ];
    for key in config_keys {
        if let Some(val) = n.get(key) {
            if !val.is_null() {
                node[key] = val.clone();
            }
        }
    }

    node
}
