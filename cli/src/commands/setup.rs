use anyhow::{bail, Context, Result};
use clap::{Subcommand, ValueEnum};
use serde_json::{json, Value};
use std::fs;
use std::io::{self, Write};
use std::path::PathBuf;

use crate::config::Config;
use crate::output::{self, OutputFormat};

// ---------------------------------------------------------------------------
// Client enum
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Copy, ValueEnum)]
pub enum McpClient {
    /// Anthropic's desktop app
    ClaudeDesktop,
    /// Anthropic's CLI agent
    ClaudeCode,
    /// AI-native code editor
    Cursor,
    /// GitHub Copilot MCP
    Vscode,
    /// Codeium's AI editor
    Windsurf,
}

impl McpClient {
    fn label(&self) -> &'static str {
        match self {
            Self::ClaudeDesktop => "Claude Desktop",
            Self::ClaudeCode => "Claude Code",
            Self::Cursor => "Cursor",
            Self::Vscode => "VS Code",
            Self::Windsurf => "Windsurf",
        }
    }
}

impl std::fmt::Display for McpClient {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.label())
    }
}

const ALL_CLIENTS: &[McpClient] = &[
    McpClient::ClaudeDesktop,
    McpClient::ClaudeCode,
    McpClient::Cursor,
    McpClient::Vscode,
    McpClient::Windsurf,
];

// ---------------------------------------------------------------------------
// Subcommand
// ---------------------------------------------------------------------------

#[derive(Subcommand)]
pub enum SetupCommand {
    /// Configure MCP integration for an IDE or AI agent
    Mcp {
        /// Target client (interactive prompt if omitted)
        #[arg(long, value_enum)]
        client: Option<McpClient>,

        /// Automatically write config to the client's config file
        #[arg(long)]
        save: bool,
    },
}

pub async fn run(
    action: SetupCommand,
    format: OutputFormat,
    api_url: Option<String>,
) -> Result<()> {
    match action {
        SetupCommand::Mcp { client, save } => setup_mcp(client, save, format, api_url).await,
    }
}

// ---------------------------------------------------------------------------
// Main logic
// ---------------------------------------------------------------------------

async fn setup_mcp(
    client: Option<McpClient>,
    save: bool,
    format: OutputFormat,
    api_url: Option<String>,
) -> Result<()> {
    let config = Config::load()?;
    let token = config.token()?;
    let base_url = api_url.as_deref().unwrap_or_else(|| config.url());
    let mcp_url = format!("{}/api/mcp", base_url.trim_end_matches('/'));

    let client = match client {
        Some(c) => c,
        None => prompt_client()?,
    };

    // Build the MCP server entry
    let zeitflow_entry = json!({
        "serverUrl": mcp_url,
        "headers": {
            "Authorization": format!("Bearer {token}")
        }
    });

    let full_config = json!({
        "mcpServers": {
            "zeitflow": &zeitflow_entry
        }
    });

    let file_path = config_path_for(&client);

    let cli_cmd = if matches!(client, McpClient::ClaudeCode) {
        Some(format!(
            "claude mcp add zeitflow --transport http \
             --url \"{}\" \
             --header \"Authorization: Bearer {}\"",
            mcp_url, token
        ))
    } else {
        None
    };

    // --- JSON output mode (for agents) ---
    if matches!(format, OutputFormat::Json) {
        let mut result = json!({
            "client": client.label(),
            "config": &full_config,
            "saved": false,
        });
        if let Some(ref path) = file_path {
            result["file_path"] = json!(path.display().to_string());
        }
        if let Some(ref cmd) = cli_cmd {
            result["cli_command"] = json!(cmd);
        }
        if save {
            if let Some(ref path) = file_path {
                merge_and_save(path, &zeitflow_entry)?;
                result["saved"] = json!(true);
            }
        }
        output::print_json(&result, format);
        return Ok(());
    }

    // --- Text output mode ---
    println!(
        "\nMCP config for {}:\n",
        client.label()
    );
    println!("{}", serde_json::to_string_pretty(&full_config)?);

    if let Some(ref path) = file_path {
        println!("\nConfig file: {}", path.display());
    }

    if let Some(ref cmd) = cli_cmd {
        println!("\nOr run this command instead:");
        println!("  {cmd}");
    }

    if save {
        if let Some(ref path) = file_path {
            merge_and_save(path, &zeitflow_entry)?;
            output::print_success(&format!("Saved to {}", path.display()));
        } else {
            println!("\nCopy the config above into your client's settings.");
        }
    } else if file_path.is_some() {
        println!("\nRe-run with --save to write automatically.");
    }

    Ok(())
}

// ---------------------------------------------------------------------------
// Interactive prompt
// ---------------------------------------------------------------------------

fn prompt_client() -> Result<McpClient> {
    eprintln!("Select a client:\n");
    for (i, c) in ALL_CLIENTS.iter().enumerate() {
        eprintln!("  {}. {}", i + 1, c.label());
    }
    eprintln!();
    eprint!("Enter number (1-{}): ", ALL_CLIENTS.len());
    io::stderr().flush()?;

    let mut input = String::new();
    io::stdin()
        .read_line(&mut input)
        .context("Failed to read input")?;
    let choice: usize = input.trim().parse().context("Invalid number")?;
    if choice < 1 || choice > ALL_CLIENTS.len() {
        bail!("Invalid selection. Choose 1-{}", ALL_CLIENTS.len());
    }
    Ok(ALL_CLIENTS[choice - 1])
}

// ---------------------------------------------------------------------------
// Config file paths
// ---------------------------------------------------------------------------

fn config_path_for(client: &McpClient) -> Option<PathBuf> {
    match client {
        McpClient::ClaudeDesktop => {
            let config_dir = dirs::config_dir()?;
            Some(config_dir.join("Claude").join("claude_desktop_config.json"))
        }
        McpClient::ClaudeCode => Some(PathBuf::from(".mcp.json")),
        McpClient::Cursor => {
            let home = dirs::home_dir()?;
            Some(home.join(".cursor").join("mcp.json"))
        }
        McpClient::Vscode => Some(PathBuf::from(".vscode").join("mcp.json")),
        McpClient::Windsurf => {
            let home = dirs::home_dir()?;
            Some(
                home.join(".codeium")
                    .join("windsurf")
                    .join("mcp_config.json"),
            )
        }
    }
}

// ---------------------------------------------------------------------------
// Merge & save
// ---------------------------------------------------------------------------

fn merge_and_save(path: &PathBuf, zeitflow_entry: &Value) -> Result<()> {
    // Read existing config or start fresh
    let mut root: Value = if path.exists() {
        let contents = fs::read_to_string(path)
            .with_context(|| format!("Failed to read {}", path.display()))?;
        serde_json::from_str(&contents)
            .with_context(|| format!("Failed to parse {}", path.display()))?
    } else {
        json!({})
    };

    // Ensure top-level is an object
    if !root.is_object() {
        root = json!({});
    }
    let obj = root.as_object_mut().unwrap();

    // Ensure mcpServers key exists
    if !obj.contains_key("mcpServers") {
        obj.insert("mcpServers".to_string(), json!({}));
    }

    // Add/update the zeitflow entry (preserves other servers)
    let servers = obj
        .get_mut("mcpServers")
        .unwrap()
        .as_object_mut()
        .context("mcpServers is not an object in the existing config")?;
    servers.insert("zeitflow".to_string(), zeitflow_entry.clone());

    // Create parent directories if needed
    if let Some(parent) = path.parent() {
        if !parent.as_os_str().is_empty() {
            fs::create_dir_all(parent)
                .with_context(|| format!("Failed to create directory {}", parent.display()))?;
        }
    }

    // Write with trailing newline
    let output = serde_json::to_string_pretty(&root)? + "\n";
    fs::write(path, &output)
        .with_context(|| format!("Failed to write {}", path.display()))?;

    Ok(())
}
