use anyhow::Result;
use clap::Subcommand;

use crate::output::{self, OutputFormat};

/// The full CLI guide, embedded at compile time.
const GUIDE_TEXT: &str = r#"ZeitFlow CLI — Manage Workflows from the Terminal
==================================================

## Overview

The ZeitFlow CLI is a lightweight command-line tool that lets you create workflows, execute
runs, inspect results, and configure MCP—all without opening a browser. It's designed with
AI agents in mind: every command supports `--output json` for machine-readable responses,
uses a consistent `zeitflow <resource> <action>` grammar, and is fully discoverable via `--help`.

## Installation

    npm install -g @zeitflow/cli

Requirements: Node.js 18+

## Quick Start

    # 1. Authenticate (opens browser to /connect)
    zeitflow auth login

    # 2. Verify
    zeitflow auth status

    # 3. List your workflows
    zeitflow workflow list

## Global Options

Every command supports these flags:

  --output json    Machine-readable JSON output (default: text)
  --help           Show help
  --version        Print version

You can set ZEITFLOW_URL as an environment variable to override the default API URL.

## Authentication — zeitflow auth

  zeitflow auth login                  Open browser to /connect, paste token to authenticate
  zeitflow auth login --token <TOKEN>  Save token directly (for scripting)
  zeitflow auth logout                 Remove stored credentials
  zeitflow auth status                 Show current auth state and API URL

Configuration is stored at ~/.zeitflow/config.json — the same file used by @zeitflow/mcp,
so if you've already authenticated with one, the other picks it up automatically.

## Workflows — zeitflow workflow (alias: wf)

### Listing and Creating

    # List all workflows
    zeitflow workflow list

    # Filter by status
    zeitflow workflow list --status published

    # Create a new workflow
    zeitflow workflow create --name "Customer Onboarding"
    zeitflow workflow create --name "Daily Report" --description "Summarizes metrics"

    # Get full details (nodes, connections, config)
    zeitflow workflow get 42

### Status Management

    # Publish a workflow so it can be executed
    zeitflow workflow publish 42

    # Archive it
    zeitflow workflow publish 42 --status archived

    # Revert to draft
    zeitflow workflow publish 42 --status draft

### Deleting

    zeitflow workflow delete 42

### Executing

    # Run with no input
    zeitflow workflow run 42

    # Pass input data as JSON
    zeitflow workflow run 42 --input '{"email":"alice@example.com","name":"Alice"}'

    # Trigger a specific entry node
    zeitflow workflow run 42 --entry-node entry_abc123

## Executions — zeitflow execution (alias: exec)

    zeitflow execution list --workflow 42           List executions for a workflow
    zeitflow execution get <ID>                     Get execution details (status, input, output)
    zeitflow execution logs <ID>                    View full execution logs
    zeitflow execution logs <ID> --level error      Filter to errors only
    zeitflow execution logs <ID> --node ai_123      Filter to a specific node

## Node Management — zeitflow workflow

Build workflows entirely from the CLI by adding nodes, connecting them, and updating their config.

### Adding Nodes

    # Add an AI node (config is the INNER config — the CLI wraps it under aiConfig automatically)
    zeitflow workflow add-node --workflow 42 --type ai --label "Summarize" \
      --config '{"model":"google/gemini-2.0-flash-001","systemPrompt":"You are a summarizer.","userPrompt":"Summarize: {{entry.content}}","outputType":"text"}'

    # Add an email node
    zeitflow workflow add-node --workflow 42 --type email --label "Send Summary" \
      --config '{"to":["{{entry.email}}"],"subject":"Summary: {{entry.title}}","message":"{{summarize.output}}"}'

    # Add a condition node
    zeitflow workflow add-node --workflow 42 --type condition --label "Is Urgent" \
      --config '{"leftValue":"{{classify.output}}","operator":"contains","rightValue":"urgent"}'

### Connecting Nodes

    # Simple connection
    zeitflow workflow connect --workflow 42 --from entry_abc --to ai_def

    # Condition node — specify which branch (true/false)
    zeitflow workflow connect --workflow 42 --from condition_123 --to slack_456 --source-handle true
    zeitflow workflow connect --workflow 42 --from condition_123 --to email_789 --source-handle false

### Updating Nodes

    # Update a node's label
    zeitflow workflow update-node --workflow 42 --node ai_def --label "Classify Ticket"

    # Update config
    zeitflow workflow update-node --workflow 42 --node ai_def \
      --config '{"model":"google/gemini-2.0-flash-001","userPrompt":"Classify: {{entry.message}}"}'

    # Add entry fields (required for input data to flow through)
    zeitflow workflow update-node --workflow 42 --node entry_abc \
      --fields '[{"key":"name","name":"Name","type":"text"},{"key":"email","name":"Email","type":"text"}]'

### Other Node Commands

    zeitflow workflow list-nodes 42                                  List all nodes in a workflow
    zeitflow workflow remove-node --workflow 42 --node ai_def        Remove a node and its connections

### Variable Reference Syntax

Nodes reference outputs from upstream nodes using {{node_label.field}}. Labels are
converted to snake_case:

  - Entry node labeled "New Ticket" with field key `subject` → {{new_ticket.subject}}
  - AI node labeled "Classify" → {{classify.output}}
  - Email node labeled "Send Alert" → {{send_alert.status}}

## Validating — zeitflow workflow validate

Check a workflow for common issues before executing.

    zeitflow workflow validate 42

Checks for:
  - Missing entry fields — entry node has no input fields defined
  - Broken variable references — {{foo.bar}} but no upstream node named "foo" exists
  - Unreachable nodes — nodes that can't be reached from any entry point
  - Missing AI prompts — AI nodes with no user prompt
  - Empty email recipients — email nodes with no `to` addresses
  - Bad condition wiring — condition node connections missing sourceHandle
  - Entry field mismatches — {{entry.name}} but the entry node doesn't have a "name" field

Returns exit code 1 if errors are found, making it usable in CI/scripts.

    # JSON output for automation
    zeitflow workflow validate 42 --output json

## Diagnostics — zeitflow doctor

    zeitflow doctor

Checks: Config file exists and is readable, API token is present and valid,
API server is reachable, token has correct permissions.

## Templates — zeitflow template (alias: tpl)

    zeitflow template list                          List available templates
    zeitflow template list --visibility public      List public templates
    zeitflow template get <ID>                      Get template details
    zeitflow template use <ID>                      Create a workflow from a template
    zeitflow template use <ID> --name "My Workflow" Create with a custom name
    zeitflow template create --workflow 42 \
      --name "Customer Support Triage" \
      --category "Customer Support" \
      --description "Classify tickets and route" \
      --visibility public --tags "ai,slack,email"   Create template from workflow
    zeitflow template delete <ID>                   Delete a template

## Integrations — zeitflow integration (alias: int)

    zeitflow integration list                       List available integrations
    zeitflow integration info <ID>                  Show integration details and config schema

## Generating Workflows — zeitflow workflow generate

Describe a workflow in natural language and let AI build it.

    zeitflow workflow generate "Take a support ticket, classify it as urgent or normal, send urgent ones to Slack"

    # Use with an existing workflow to modify it
    zeitflow workflow generate "Add an SMS notification node after the email" --workflow 42

## Setup MCP — zeitflow setup mcp

    zeitflow setup mcp                              Interactive — prompts you to pick a client
    zeitflow setup mcp --client claude-desktop      Specify client directly
    zeitflow setup mcp --client cursor --save       Auto-write config file
    zeitflow setup mcp --client claude-code --output json

Supported clients: claude-desktop, claude-code, cursor, vscode, windsurf.

## End-to-End Example

    # 1. Create the workflow
    zeitflow workflow create --name "Content Summarizer"

    # 2. Add entry fields
    zeitflow workflow update-node --workflow 42 --node entry_abc \
      --fields '[{"key":"title","name":"Title","type":"text"},{"key":"content","name":"Content","type":"text"},{"key":"email","name":"Email","type":"text"}]'

    # 3. Add an AI summarizer node
    zeitflow workflow add-node --workflow 42 --type ai --label "Summarize" \
      --config '{"model":"google/gemini-2.0-flash-001","systemPrompt":"Summarize content with bullet points.","userPrompt":"Summarize:\n\n{{entry.content}}","outputType":"text"}'

    # 4. Add an email node
    zeitflow workflow add-node --workflow 42 --type email --label "Send Summary" \
      --config '{"to":["{{entry.email}}"],"subject":"Summary: {{entry.title}}","message":"{{summarize.output}}"}'

    # 5. Connect the nodes
    zeitflow workflow connect --workflow 42 --from entry_abc --to ai_def
    zeitflow workflow connect --workflow 42 --from ai_def --to email_ghi

    # 6. Validate
    zeitflow workflow validate 42

    # 7. Execute
    zeitflow workflow run 42 --input '{"title":"ZeitFlow","content":"ZeitFlow is...","email":"me@example.com"}'

    # 8. Check result
    zeitflow execution logs 99

## Tips for AI Agents

  1. Always use --output json — parse structured data, not formatted tables
  2. Set ZEITFLOW_URL in your environment to point at a custom API endpoint
  3. Check zeitflow auth status --output json before making API calls
  4. Run --help to discover all available commands and flags
  5. Aliases save keystrokes: wf (workflow), exec (execution), ls (list), rm (delete)

## Troubleshooting

  "Not authenticated" → Run zeitflow auth login
  "API error (401)"   → Token invalid/expired, re-authenticate
  "API error (429)"   → Rate limited, wait a minute (100 req/hr)
  "Request failed"    → Check URL with zeitflow auth status
"#;

#[derive(Subcommand)]
pub enum GuideCommand {
    /// Show the full CLI guide
    Show,

    /// Search the guide for a topic
    Search {
        /// Search query
        query: String,
    },
}

pub async fn run(
    action: Option<GuideCommand>,
    format: OutputFormat,
    _api_url: Option<String>,
) -> Result<()> {
    match action {
        None | Some(GuideCommand::Show) => match format {
            OutputFormat::Json => {
                let guide = serde_json::json!({
                    "guide": GUIDE_TEXT,
                });
                output::print_json(&guide, format);
            }
            OutputFormat::Text => {
                println!("{GUIDE_TEXT}");
            }
        },
        Some(GuideCommand::Search { query }) => {
            let query_lower = query.to_lowercase();
            let mut matches: Vec<&str> = Vec::new();

            // Split guide into sections by ## headings
            let sections: Vec<&str> = GUIDE_TEXT.split("\n## ").collect();
            for section in &sections {
                if section.to_lowercase().contains(&query_lower) {
                    matches.push(section);
                }
            }

            match format {
                OutputFormat::Json => {
                    let result = serde_json::json!({
                        "query": query,
                        "matchCount": matches.len(),
                        "sections": matches,
                    });
                    output::print_json(&result, format);
                }
                OutputFormat::Text => {
                    if matches.is_empty() {
                        println!("No sections found matching \"{query}\"");
                        println!("Run `zeitflow guide` to see the full guide.");
                    } else {
                        println!(
                            "Found {} section(s) matching \"{}\":\n",
                            matches.len(),
                            query
                        );
                        for section in &matches {
                            // Re-add the ## prefix for non-first sections
                            let display = if section.starts_with("ZeitFlow") {
                                section.to_string()
                            } else {
                                format!("## {section}")
                            };
                            println!("{display}");
                            println!("{}", "─".repeat(60));
                        }
                    }
                }
            }
        }
    }
    Ok(())
}
