use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Config {
    #[serde(alias = "api_url")]
    pub url: Option<String>,
    #[serde(alias = "api_token")]
    pub token: Option<String>,
}

impl Config {
    fn dir() -> Result<PathBuf> {
        let home = std::env::var("HOME").context("HOME environment variable not set")?;
        let dir = PathBuf::from(home).join(".zeitflow");
        fs::create_dir_all(&dir).context("Failed to create config directory")?;
        Ok(dir)
    }

    fn path() -> Result<PathBuf> {
        Ok(Self::dir()?.join("config.json"))
    }

    /// Old config location (~/.config/zeitflow/config.json) for migration
    fn legacy_path() -> Option<PathBuf> {
        dirs::config_dir().map(|d| d.join("zeitflow").join("config.json"))
    }

    pub fn load() -> Result<Self> {
        let path = Self::path()?;

        if path.exists() {
            let contents = fs::read_to_string(&path).context("Failed to read config file")?;
            return serde_json::from_str(&contents).context("Failed to parse config file");
        }

        // Migrate from legacy location if it exists
        if let Some(legacy) = Self::legacy_path() {
            if legacy.exists() {
                let contents =
                    fs::read_to_string(&legacy).context("Failed to read legacy config file")?;
                // serde aliases handle the old api_token/api_url field names
                let config: Config =
                    serde_json::from_str(&contents).context("Failed to parse legacy config")?;
                // Save to new location (also sets permissions)
                config.save()?;
                return Ok(config);
            }
        }

        Ok(Self::default())
    }

    pub fn save(&self) -> Result<()> {
        let path = Self::path()?;
        let contents = serde_json::to_string_pretty(self)?;
        fs::write(&path, &contents).context("Failed to write config file")?;

        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(&path, fs::Permissions::from_mode(0o600))
                .context("Failed to set config file permissions")?;
        }

        Ok(())
    }

    pub fn url(&self) -> &str {
        self.url.as_deref().unwrap_or("https://www.zeitflow.io")
    }

    pub fn token(&self) -> Result<&str> {
        self.token.as_deref().context(
            "Not authenticated. Run `zeitflow auth login` first.",
        )
    }
}
