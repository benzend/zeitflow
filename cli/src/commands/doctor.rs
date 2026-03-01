use anyhow::Result;
use colored::Colorize;

use crate::config::Config;
use crate::output::OutputFormat;

struct Check {
    name: &'static str,
    status: CheckStatus,
    detail: String,
}

enum CheckStatus {
    Ok,
    Warn,
    Fail,
}

pub async fn run(format: OutputFormat, api_url: Option<String>) -> Result<()> {
    let mut checks: Vec<Check> = Vec::new();

    // 1. Config file
    checks.push(check_config_file());

    // 2. Config permissions (unix only)
    #[cfg(unix)]
    checks.push(check_config_permissions());

    // 3. Authentication token
    let config = Config::load()?;
    let base_url = api_url.as_deref().unwrap_or_else(|| config.url());
    checks.push(check_token(&config));

    // 4. API connectivity
    checks.push(check_api_reachable(base_url).await);

    // 5. Token validity (only if token is present)
    if config.token.is_some() {
        checks.push(check_token_valid(&config, base_url).await);
    }

    // Output
    match format {
        OutputFormat::Json => {
            let items: Vec<serde_json::Value> = checks
                .iter()
                .map(|c| {
                    serde_json::json!({
                        "check": c.name,
                        "status": match c.status {
                            CheckStatus::Ok => "ok",
                            CheckStatus::Warn => "warn",
                            CheckStatus::Fail => "fail",
                        },
                        "detail": c.detail,
                    })
                })
                .collect();
            let output = serde_json::json!({
                "checks": items,
                "ok": checks.iter().all(|c| matches!(c.status, CheckStatus::Ok)),
            });
            println!("{}", serde_json::to_string_pretty(&output).unwrap());
        }
        OutputFormat::Text => {
            println!("{}", "ZeitFlow Doctor".bold());
            println!("{}", "═".repeat(40));
            println!();

            for check in &checks {
                let icon = match check.status {
                    CheckStatus::Ok => "✓".green().bold(),
                    CheckStatus::Warn => "!".yellow().bold(),
                    CheckStatus::Fail => "✗".red().bold(),
                };
                println!("{icon} {}: {}", check.name, check.detail);
            }

            println!();

            let fails = checks
                .iter()
                .filter(|c| matches!(c.status, CheckStatus::Fail))
                .count();
            let warns = checks
                .iter()
                .filter(|c| matches!(c.status, CheckStatus::Warn))
                .count();

            if fails > 0 {
                println!(
                    "{}",
                    format!("{fails} issue(s) found. See above for details.").red()
                );
            } else if warns > 0 {
                println!(
                    "{}",
                    format!("All checks passed with {warns} warning(s).").yellow()
                );
            } else {
                println!("{}", "All checks passed.".green());
            }
        }
    }

    Ok(())
}

fn check_config_file() -> Check {
    let home = match std::env::var("HOME") {
        Ok(h) => h,
        Err(_) => {
            return Check {
                name: "Config file",
                status: CheckStatus::Fail,
                detail: "HOME environment variable not set".into(),
            };
        }
    };

    let path = std::path::PathBuf::from(&home)
        .join(".zeitflow")
        .join("config.json");

    if path.exists() {
        Check {
            name: "Config file",
            status: CheckStatus::Ok,
            detail: format!("{}", path.display()),
        }
    } else {
        Check {
            name: "Config file",
            status: CheckStatus::Warn,
            detail: format!(
                "Not found at {}. Run `zeitflow auth login` to create it.",
                path.display()
            ),
        }
    }
}

#[cfg(unix)]
fn check_config_permissions() -> Check {
    use std::os::unix::fs::PermissionsExt;

    let home = match std::env::var("HOME") {
        Ok(h) => h,
        Err(_) => {
            return Check {
                name: "Config permissions",
                status: CheckStatus::Warn,
                detail: "Skipped (HOME not set)".into(),
            };
        }
    };

    let path = std::path::PathBuf::from(&home)
        .join(".zeitflow")
        .join("config.json");

    if !path.exists() {
        return Check {
            name: "Config permissions",
            status: CheckStatus::Warn,
            detail: "Skipped (no config file)".into(),
        };
    }

    match std::fs::metadata(&path) {
        Ok(meta) => {
            let mode = meta.permissions().mode() & 0o777;
            if mode == 0o600 {
                Check {
                    name: "Config permissions",
                    status: CheckStatus::Ok,
                    detail: "0600 (owner read/write only)".into(),
                }
            } else {
                Check {
                    name: "Config permissions",
                    status: CheckStatus::Warn,
                    detail: format!(
                        "0{:o} — expected 0600. Run `chmod 600 ~/.zeitflow/config.json`.",
                        mode
                    ),
                }
            }
        }
        Err(e) => Check {
            name: "Config permissions",
            status: CheckStatus::Fail,
            detail: format!("Could not read file metadata: {e}"),
        },
    }
}

fn check_token(config: &Config) -> Check {
    if config.token.is_some() {
        Check {
            name: "Auth token",
            status: CheckStatus::Ok,
            detail: "Token configured".into(),
        }
    } else {
        Check {
            name: "Auth token",
            status: CheckStatus::Fail,
            detail: "No token found. Run `zeitflow auth login`.".into(),
        }
    }
}

async fn check_api_reachable(base_url: &str) -> Check {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build();

    let client = match client {
        Ok(c) => c,
        Err(e) => {
            return Check {
                name: "API reachable",
                status: CheckStatus::Fail,
                detail: format!("Could not build HTTP client: {e}"),
            };
        }
    };

    let url = format!("{}/api/workflows", base_url.trim_end_matches('/'));
    match client.head(&url).send().await {
        Ok(resp) => {
            // Any response (even 401) means the server is reachable
            Check {
                name: "API reachable",
                status: CheckStatus::Ok,
                detail: format!("{base_url} (HTTP {})", resp.status().as_u16()),
            }
        }
        Err(e) => {
            let detail = if e.is_timeout() {
                format!("{base_url} — connection timed out")
            } else if e.is_connect() {
                format!("{base_url} — connection refused")
            } else {
                format!("{base_url} — {e}")
            };
            Check {
                name: "API reachable",
                status: CheckStatus::Fail,
                detail,
            }
        }
    }
}

async fn check_token_valid(config: &Config, base_url: &str) -> Check {
    let token = match &config.token {
        Some(t) => t,
        None => {
            return Check {
                name: "Token valid",
                status: CheckStatus::Fail,
                detail: "No token to validate".into(),
            };
        }
    };

    let client = match reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
    {
        Ok(c) => c,
        Err(e) => {
            return Check {
                name: "Token valid",
                status: CheckStatus::Fail,
                detail: format!("Could not build HTTP client: {e}"),
            };
        }
    };

    let url = format!("{}/api/workflows", base_url.trim_end_matches('/'));
    match client
        .get(&url)
        .header("Authorization", format!("Bearer {token}"))
        .send()
        .await
    {
        Ok(resp) => {
            if resp.status() == reqwest::StatusCode::UNAUTHORIZED {
                Check {
                    name: "Token valid",
                    status: CheckStatus::Fail,
                    detail: format!(
                        "Token rejected (401). Generate a new one at {}/connect",
                        base_url
                    ),
                }
            } else if resp.status().is_success() {
                Check {
                    name: "Token valid",
                    status: CheckStatus::Ok,
                    detail: "Authenticated successfully".into(),
                }
            } else {
                Check {
                    name: "Token valid",
                    status: CheckStatus::Warn,
                    detail: format!("Unexpected status: {}", resp.status()),
                }
            }
        }
        Err(e) => Check {
            name: "Token valid",
            status: CheckStatus::Fail,
            detail: format!("Request failed: {e}"),
        },
    }
}
