pub mod auth;
pub mod execution;
pub mod integration;
pub mod template;
pub mod workflow;

use anyhow::Result;
use clap::{Parser, Subcommand};

use crate::output::OutputFormat;

#[derive(Parser)]
#[command(
    name = "zeitflow",
    about = "CLI for ZeitFlow workflow automation platform",
    version,
    propagate_version = true
)]
pub struct Cli {
    #[command(subcommand)]
    pub command: Command,

    /// Output format
    #[arg(long, global = true, default_value = "text", value_enum)]
    pub output: OutputFormat,

    /// API server URL (overrides config)
    #[arg(long, global = true, env = "ZEITFLOW_API_URL")]
    pub api_url: Option<String>,
}

#[derive(Subcommand)]
pub enum Command {
    /// Manage workflows
    #[command(alias = "wf")]
    Workflow {
        #[command(subcommand)]
        action: workflow::WorkflowCommand,
    },

    /// View and monitor executions
    #[command(alias = "exec")]
    Execution {
        #[command(subcommand)]
        action: execution::ExecutionCommand,
    },

    /// Configure integrations
    #[command(alias = "int")]
    Integration {
        #[command(subcommand)]
        action: integration::IntegrationCommand,
    },

    /// Manage workflow templates
    #[command(alias = "tpl")]
    Template {
        #[command(subcommand)]
        action: template::TemplateCommand,
    },

    /// Authentication
    Auth {
        #[command(subcommand)]
        action: auth::AuthCommand,
    },
}

pub async fn run(cli: Cli) -> Result<()> {
    match cli.command {
        Command::Workflow { action } => workflow::run(action, cli.output, cli.api_url).await,
        Command::Execution { action } => execution::run(action, cli.output, cli.api_url).await,
        Command::Integration { action } => {
            integration::run(action, cli.output, cli.api_url).await
        }
        Command::Template { action } => template::run(action, cli.output, cli.api_url).await,
        Command::Auth { action } => auth::run(action, cli.output, cli.api_url).await,
    }
}
