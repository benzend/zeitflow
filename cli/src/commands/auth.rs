use anyhow::{Context, Result};
use clap::Subcommand;
use std::io::{self, Write};

use crate::config::Config;
use crate::output::{self, OutputFormat};

#[derive(Subcommand)]
pub enum AuthCommand {
    /// Log in with API token (opens browser or use --token for scripting)
    Login {
        /// API token (skips interactive browser flow)
        #[arg(long)]
        token: Option<String>,
    },

    /// Log out and remove stored credentials
    Logout,

    /// Show current auth status
    Status,
}

pub async fn run(action: AuthCommand, format: OutputFormat, api_url: Option<String>) -> Result<()> {
    match action {
        AuthCommand::Login { token } => {
            let config = Config::load()?;
            let base_url = api_url
                .as_deref()
                .unwrap_or_else(|| config.url());
            let connect_url = format!("{}/connect", base_url.trim_end_matches('/'));

            let token = if let Some(t) = token {
                t
            } else {
                // Interactive flow: open browser and prompt for token
                eprintln!("Opening {} in your browser...", connect_url);
                eprintln!("(If it doesn't open, visit the URL manually)\n");
                let _ = open::that(&connect_url);

                eprint!("Paste your API token: ");
                io::stderr().flush()?;
                let mut input = String::new();
                io::stdin()
                    .read_line(&mut input)
                    .context("Failed to read token from stdin")?;
                let t = input.trim().to_string();
                if t.is_empty() {
                    anyhow::bail!("No token provided.");
                }
                t
            };

            // Validate token by making a test API call
            let url = api_url
                .as_deref()
                .unwrap_or_else(|| config.url());
            validate_token(&token, url).await?;

            let mut config = Config::load()?;
            config.token = Some(token);
            config.save()?;
            output::print_success("Authenticated successfully. Token saved to ~/.zeitflow/config.json");
            Ok(())
        }

        AuthCommand::Logout => {
            let mut config = Config::load()?;
            config.token = None;
            config.save()?;
            output::print_success("Logged out. Token removed.");
            Ok(())
        }

        AuthCommand::Status => {
            let config = Config::load()?;
            let authenticated = config.token.is_some();
            let url = config.url().to_string();

            match format {
                OutputFormat::Json => {
                    let status = serde_json::json!({
                        "authenticated": authenticated,
                        "url": url,
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
    }
}

async fn validate_token(token: &str, base_url: &str) -> Result<()> {
    let client = reqwest::Client::new();
    let url = format!("{}/api/workflows", base_url.trim_end_matches('/'));
    let resp = client
        .get(&url)
        .header("Authorization", format!("Bearer {token}"))
        .send()
        .await
        .context("Failed to connect to ZeitFlow API")?;

    if resp.status() == reqwest::StatusCode::UNAUTHORIZED {
        anyhow::bail!("Invalid token. Check your token at {}/connect", base_url);
    }
    if !resp.status().is_success() {
        anyhow::bail!(
            "API returned status {}. Is the server reachable?",
            resp.status()
        );
    }
    Ok(())
}
