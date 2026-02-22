use anyhow::Result;
use clap::Subcommand;

use crate::config::Config;
use crate::output::{self, OutputFormat};

#[derive(Subcommand)]
pub enum AuthCommand {
    /// Log in with API token
    Login {
        /// API token from ZeitFlow settings page
        #[arg(long)]
        token: String,
    },

    /// Log out and remove stored credentials
    Logout,

    /// Show current auth status
    Status,

    /// Set the API server URL
    #[command(name = "set-url")]
    SetUrl {
        /// API server URL (e.g. https://zeitflow.example.com)
        url: String,
    },
}

pub async fn run(action: AuthCommand, format: OutputFormat, ) -> Result<()> {
    match action {
        AuthCommand::Login { token } => {
            let mut config = Config::load()?;
            config.api_token = Some(token);
            config.save()?;
            output::print_success("Authenticated successfully. Token saved.");
            Ok(())
        }

        AuthCommand::Logout => {
            let mut config = Config::load()?;
            config.api_token = None;
            config.save()?;
            output::print_success("Logged out. Token removed.");
            Ok(())
        }

        AuthCommand::Status => {
            let config = Config::load()?;
            let authenticated = config.api_token.is_some();
            let url = config.api_url().to_string();

            match format {
                OutputFormat::Json => {
                    let status = serde_json::json!({
                        "authenticated": authenticated,
                        "api_url": url,
                    });
                    output::print_json(&status, format);
                }
                OutputFormat::Text => {
                    println!("API URL: {url}");
                    if authenticated {
                        println!("Status:  authenticated");
                    } else {
                        println!("Status:  not authenticated");
                    }
                }
            }
            Ok(())
        }

        AuthCommand::SetUrl { url } => {
            let mut config = Config::load()?;
            config.api_url = Some(url.clone());
            config.save()?;
            output::print_success(&format!("API URL set to {url}"));
            Ok(())
        }
    }
}
