use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Config {
    pub api_url: Option<String>,
    pub api_token: Option<String>,
}

impl Config {
    fn path() -> Result<PathBuf> {
        let dir = dirs::config_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("zeitflow");
        fs::create_dir_all(&dir).context("Failed to create config directory")?;
        Ok(dir.join("config.json"))
    }

    pub fn load() -> Result<Self> {
        let path = Self::path()?;
        if !path.exists() {
            return Ok(Self::default());
        }
        let contents = fs::read_to_string(&path).context("Failed to read config file")?;
        serde_json::from_str(&contents).context("Failed to parse config file")
    }

    pub fn save(&self) -> Result<()> {
        let path = Self::path()?;
        let contents = serde_json::to_string_pretty(self)?;
        fs::write(&path, contents).context("Failed to write config file")
    }

    pub fn api_url(&self) -> &str {
        self.api_url
            .as_deref()
            .unwrap_or("http://localhost:3000")
    }

    pub fn api_token(&self) -> Result<&str> {
        self.api_token
            .as_deref()
            .context("Not authenticated. Run `zeitflow auth login` first.")
    }
}
