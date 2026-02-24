use anyhow::Result;
use clap::Subcommand;
use serde_json::Value;

use crate::client::ApiClient;
use crate::config::Config;
use crate::generated;
use crate::output::{self, OutputFormat};

#[derive(Subcommand)]
pub enum IntegrationCommand {
    /// List available integrations
    #[command(alias = "ls")]
    List,

    /// Show integration details and required configuration
    Info {
        /// Integration ID (e.g. email, slack, sms, telegram, youtube)
        id: String,
    },

    /// Test an integration connection
    Test {
        /// Integration ID
        id: String,
    },
}

pub async fn run(
    action: IntegrationCommand,
    format: OutputFormat,
    api_url: Option<String>,
) -> Result<()> {
    match action {
        IntegrationCommand::List => {
            match format {
                OutputFormat::Json => {
                    let list: Vec<Value> = generated::INTEGRATION_IDS
                        .iter()
                        .filter_map(|id| {
                            generated::integration_info(id).map(|meta| {
                                serde_json::json!({
                                    "id": id,
                                    "name": meta.name,
                                    "description": meta.description,
                                    "category": meta.category,
                                })
                            })
                        })
                        .collect();
                    output::print_json(&list, format);
                }
                OutputFormat::Text => {
                    let rows: Vec<Vec<String>> = generated::INTEGRATION_IDS
                        .iter()
                        .filter_map(|id| {
                            generated::integration_info(id).map(|meta| {
                                vec![
                                    id.to_string(),
                                    meta.name.to_string(),
                                    meta.category.to_string(),
                                    meta.description.to_string(),
                                ]
                            })
                        })
                        .collect();
                    output::print_table(
                        &["ID", "NAME", "CATEGORY", "DESCRIPTION"],
                        &rows,
                    );
                }
            }
            Ok(())
        }

        IntegrationCommand::Info { id } => {
            let meta = generated::integration_info(&id)
                .ok_or_else(|| anyhow::anyhow!("Unknown integration: {id}"))?;

            match format {
                OutputFormat::Json => {
                    let info = serde_json::json!({
                        "id": id,
                        "name": meta.name,
                        "description": meta.description,
                        "category": meta.category,
                        "configFields": meta.config_fields,
                        "envVar": meta.env_var,
                    });
                    output::print_json(&info, format);
                }
                OutputFormat::Text => {
                    println!("{} ({})", meta.name, id);
                    println!("  {}", meta.description);
                    println!("  Category: {}", meta.category);
                    println!("  Env var:  {}", meta.env_var);
                    println!("  Config fields:");
                    for field in meta.config_fields {
                        println!("    - {field}");
                    }
                }
            }
            Ok(())
        }

        IntegrationCommand::Test { id } => {
            let mut config = Config::load()?;
            if let Some(url) = api_url {
                config.url = Some(url);
            }
            let client = ApiClient::new(&config)?;

            // Currently only Slack has a test endpoint
            match id.as_str() {
                "slack" => {
                    let result: Value =
                        client.get("/api/slack/test").await?;
                    match format {
                        OutputFormat::Json => output::print_json(&result, format),
                        OutputFormat::Text => {
                            if result["ok"].as_bool().unwrap_or(false) {
                                output::print_success("Slack connection OK");
                            } else {
                                output::print_error(&format!(
                                    "Slack test failed: {}",
                                    result
                                ));
                            }
                        }
                    }
                }
                _ => {
                    println!(
                        "No test endpoint available for '{id}'. \
                         Integration testing is done by running a workflow."
                    );
                }
            }
            Ok(())
        }
    }
}
