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

    /// Get workflow details
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
}

pub async fn run(
    action: WorkflowCommand,
    format: OutputFormat,
    api_url: Option<String>,
) -> Result<()> {
    let mut config = Config::load()?;
    if let Some(url) = api_url {
        config.api_url = Some(url);
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
                            ]
                        })
                        .collect();

                    output::print_table(&["ID", "NAME", "STATUS"], &rows);
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
                    let id = &result["id"];
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
    }
}
