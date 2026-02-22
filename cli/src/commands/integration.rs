use anyhow::Result;
use clap::Subcommand;
use serde_json::Value;

use crate::client::ApiClient;
use crate::config::Config;
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

/// Known integration metadata (mirrors lib/integrations/definitions)
fn integration_info(id: &str) -> Option<IntegrationMeta> {
    match id {
        "email" => Some(IntegrationMeta {
            name: "Email",
            description: "Send emails via Resend",
            category: "communication",
            config_fields: &["to", "subject", "message", "from"],
            env_var: "RESEND_API_KEY",
        }),
        "slack" => Some(IntegrationMeta {
            name: "Slack",
            description: "Send messages via Slack Web API",
            category: "communication",
            config_fields: &["channel", "message", "threadTs"],
            env_var: "SLACK_CLIENT_ID / SLACK_CLIENT_SECRET (OAuth)",
        }),
        "sms" => Some(IntegrationMeta {
            name: "SMS",
            description: "Send text messages via Twilio",
            category: "communication",
            config_fields: &["phoneNumber", "message"],
            env_var: "TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER",
        }),
        "telegram" => Some(IntegrationMeta {
            name: "Telegram",
            description: "Send messages via Telegram Bot API",
            category: "communication",
            config_fields: &["chatId", "message", "parseMode"],
            env_var: "TELEGRAM_BOT_TOKEN",
        }),
        "youtube" => Some(IntegrationMeta {
            name: "YouTube",
            description: "Fetch video data or post comments",
            category: "data",
            config_fields: &["action", "videoId", "text"],
            env_var: "YOUTUBE_API_KEY",
        }),
        "condition" => Some(IntegrationMeta {
            name: "Condition",
            description: "Conditional branching based on expressions",
            category: "utility",
            config_fields: &["operator", "leftValue", "rightValue"],
            env_var: "(none)",
        }),
        _ => None,
    }
}

struct IntegrationMeta {
    name: &'static str,
    description: &'static str,
    category: &'static str,
    config_fields: &'static [&'static str],
    env_var: &'static str,
}

pub async fn run(
    action: IntegrationCommand,
    format: OutputFormat,
    api_url: Option<String>,
) -> Result<()> {
    match action {
        IntegrationCommand::List => {
            let ids = ["email", "slack", "sms", "telegram", "youtube", "condition"];
            match format {
                OutputFormat::Json => {
                    let list: Vec<Value> = ids
                        .iter()
                        .filter_map(|id| {
                            integration_info(id).map(|meta| {
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
                    let rows: Vec<Vec<String>> = ids
                        .iter()
                        .filter_map(|id| {
                            integration_info(id).map(|meta| {
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
            let meta = integration_info(&id)
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
                config.api_url = Some(url);
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
