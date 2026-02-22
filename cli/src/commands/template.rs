use anyhow::Result;
use clap::Subcommand;
use serde_json::Value;

use crate::client::ApiClient;
use crate::config::Config;
use crate::output::{self, OutputFormat};

#[derive(Subcommand)]
pub enum TemplateCommand {
    /// List available templates
    #[command(alias = "ls")]
    List {
        /// Filter by category
        #[arg(long)]
        category: Option<String>,

        /// Search by name/description
        #[arg(long)]
        search: Option<String>,

        /// Filter by visibility: private, public, official
        #[arg(long)]
        visibility: Option<String>,

        /// Max results
        #[arg(long, default_value = "50")]
        limit: i64,
    },

    /// Get template details
    Get {
        /// Template ID
        id: i64,
    },

    /// Create a workflow from a template
    Use {
        /// Template ID
        id: i64,

        /// Name for the new workflow (defaults to template name)
        #[arg(long)]
        name: Option<String>,
    },

    /// Create a template from an existing workflow
    Create {
        /// Source workflow ID
        #[arg(long)]
        workflow: i64,

        /// Template name
        #[arg(long)]
        name: String,

        /// Category
        #[arg(long)]
        category: String,

        /// Description
        #[arg(long)]
        description: Option<String>,

        /// Visibility: private, public
        #[arg(long, default_value = "private")]
        visibility: String,

        /// Tags (comma-separated)
        #[arg(long)]
        tags: Option<String>,
    },

    /// Delete a template
    #[command(alias = "rm")]
    Delete {
        /// Template ID
        id: i64,
    },
}

pub async fn run(
    action: TemplateCommand,
    format: OutputFormat,
    api_url: Option<String>,
) -> Result<()> {
    let mut config = Config::load()?;
    if let Some(url) = api_url {
        config.api_url = Some(url);
    }
    let client = ApiClient::new(&config)?;

    match action {
        TemplateCommand::List {
            category,
            search,
            visibility,
            limit,
        } => {
            let mut params = vec![format!("limit={limit}")];
            if let Some(c) = &category {
                params.push(format!("category={c}"));
            }
            if let Some(s) = &search {
                params.push(format!("search={s}"));
            }
            if let Some(v) = &visibility {
                params.push(format!("visibility={v}"));
            }
            let query = params.join("&");
            let path = format!("/api/templates?{query}");

            let result: Value = client.get(&path).await?;

            match format {
                OutputFormat::Json => output::print_json(&result, format),
                OutputFormat::Text => {
                    let items = result
                        .get("templates")
                        .and_then(|t| t.as_array())
                        .cloned()
                        .unwrap_or_default();

                    let rows: Vec<Vec<String>> = items
                        .iter()
                        .map(|t| {
                            vec![
                                t["id"].to_string(),
                                t["name"]
                                    .as_str()
                                    .unwrap_or("(unnamed)")
                                    .to_string(),
                                t["category"]
                                    .as_str()
                                    .unwrap_or("")
                                    .to_string(),
                                t["visibility"]
                                    .as_str()
                                    .unwrap_or("")
                                    .to_string(),
                                t["useCount"].to_string(),
                            ]
                        })
                        .collect();

                    output::print_table(
                        &["ID", "NAME", "CATEGORY", "VISIBILITY", "USES"],
                        &rows,
                    );
                }
            }
            Ok(())
        }

        TemplateCommand::Get { id } => {
            let result: Value =
                client.get(&format!("/api/templates/{id}")).await?;
            output::print_json(&result, format);
            Ok(())
        }

        TemplateCommand::Use { id, name } => {
            let mut body = serde_json::json!({});
            if let Some(n) = &name {
                body["workflowName"] = Value::String(n.clone());
            }

            let result: Value = client
                .post(&format!("/api/templates/{id}/use"), &body)
                .await?;

            match format {
                OutputFormat::Json => output::print_json(&result, format),
                OutputFormat::Text => {
                    let wf = result.get("workflow");
                    let wf_id = wf
                        .and_then(|w| w.get("id"))
                        .unwrap_or(&Value::Null);
                    let wf_name = wf
                        .and_then(|w| w["name"].as_str())
                        .unwrap_or("(unnamed)");
                    output::print_success(&format!(
                        "Workflow '{wf_name}' created from template (id: {wf_id})"
                    ));
                    println!(
                        "  Edit: zeitflow workflow get {wf_id}"
                    );
                }
            }
            Ok(())
        }

        TemplateCommand::Create {
            workflow,
            name,
            category,
            description,
            visibility,
            tags,
        } => {
            let mut body = serde_json::json!({
                "sourceWorkflowId": workflow,
                "name": name,
                "category": category,
                "visibility": visibility,
            });
            if let Some(desc) = description {
                body["description"] = Value::String(desc);
            }
            if let Some(tag_str) = tags {
                let tag_list: Vec<Value> = tag_str
                    .split(',')
                    .map(|t| Value::String(t.trim().to_string()))
                    .collect();
                body["tags"] = Value::Array(tag_list);
            }

            let result: Value =
                client.post("/api/templates", &body).await?;

            match format {
                OutputFormat::Json => output::print_json(&result, format),
                OutputFormat::Text => {
                    let tmpl_id = result
                        .get("template")
                        .and_then(|t| t.get("id"))
                        .unwrap_or(&Value::Null);
                    output::print_success(&format!(
                        "Template '{name}' created (id: {tmpl_id})"
                    ));
                }
            }
            Ok(())
        }

        TemplateCommand::Delete { id } => {
            let result = client
                .delete(&format!("/api/templates/{id}"))
                .await?;
            match format {
                OutputFormat::Json => output::print_json(&result, format),
                OutputFormat::Text => {
                    output::print_success(&format!("Template {id} deleted"));
                }
            }
            Ok(())
        }
    }
}
