use anyhow::Result;
use clap::Subcommand;
use serde_json::Value;

use crate::client::ApiClient;
use crate::config::Config;
use crate::output::{self, OutputFormat};

#[derive(Subcommand)]
pub enum ExecutionCommand {
    /// Get execution details and logs
    Get {
        /// Execution ID
        id: i64,
    },

    /// Show execution logs with optional filtering
    Logs {
        /// Execution ID
        id: i64,

        /// Filter by log level: debug, info, warn, error
        #[arg(long)]
        level: Option<String>,

        /// Show only logs from a specific node
        #[arg(long)]
        node: Option<String>,
    },
}

pub async fn run(
    action: ExecutionCommand,
    format: OutputFormat,
    api_url: Option<String>,
) -> Result<()> {
    let mut config = Config::load()?;
    if let Some(url) = api_url {
        config.api_url = Some(url);
    }
    let client = ApiClient::new(&config)?;

    match action {
        ExecutionCommand::Get { id } => {
            let execution: Value = client
                .get(&format!("/api/workflow/execution/{id}"))
                .await?;

            match format {
                OutputFormat::Json => output::print_json(&execution, format),
                OutputFormat::Text => {
                    let exec = execution
                        .as_object()
                        .and_then(|o| o.get("execution"))
                        .unwrap_or(&execution);

                    println!(
                        "Execution #{id}  status: {}",
                        exec["status"].as_str().unwrap_or("unknown")
                    );

                    if let Some(input) = exec.get("inputData") {
                        if !input.is_null() {
                            println!("\nInput:");
                            println!(
                                "  {}",
                                serde_json::to_string_pretty(input)?
                            );
                        }
                    }

                    if let Some(output_data) = exec.get("outputData") {
                        if !output_data.is_null() {
                            println!("\nOutput:");
                            println!(
                                "  {}",
                                serde_json::to_string_pretty(output_data)?
                            );
                        }
                    }
                }
            }
            Ok(())
        }

        ExecutionCommand::Logs { id, level, node } => {
            let execution: Value = client
                .get(&format!("/api/workflow/execution/{id}"))
                .await?;

            let exec = execution
                .as_object()
                .and_then(|o| o.get("execution"))
                .unwrap_or(&execution);

            let logs = exec["logs"]
                .as_array()
                .cloned()
                .unwrap_or_default();

            let filtered: Vec<&Value> = logs
                .iter()
                .filter(|log| {
                    if let Some(ref lvl) = level {
                        if log["level"].as_str().unwrap_or("") != lvl.as_str() {
                            return false;
                        }
                    }
                    if let Some(ref n) = node {
                        if log["nodeId"].as_str().unwrap_or("") != n.as_str() {
                            return false;
                        }
                    }
                    true
                })
                .collect();

            match format {
                OutputFormat::Json => output::print_json(&filtered, format),
                OutputFormat::Text => {
                    if filtered.is_empty() {
                        println!("  (no logs matching filter)");
                        return Ok(());
                    }

                    for log in &filtered {
                        let level_str =
                            log["level"].as_str().unwrap_or("info");
                        let level_display = match level_str {
                            "error" => format!("[{level_str}]"),
                            "warn" => format!("[{level_str}] "),
                            "debug" => format!("[{level_str}]"),
                            _ => format!("[{level_str}] "),
                        };
                        let ts = log["timestamp"]
                            .as_str()
                            .unwrap_or("");
                        let node_id = log["nodeId"]
                            .as_str()
                            .unwrap_or("?");
                        let msg = log["message"]
                            .as_str()
                            .unwrap_or("");

                        println!("{ts} {level_display} [{node_id}] {msg}");

                        if let Some(data) = log.get("data") {
                            if !data.is_null() {
                                println!(
                                    "         {}",
                                    serde_json::to_string(data)?
                                );
                            }
                        }
                    }
                }
            }
            Ok(())
        }
    }
}
