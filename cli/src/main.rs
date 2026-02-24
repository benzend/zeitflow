mod client;
mod commands;
mod config;
mod generated;
mod output;

use anyhow::Result;
use clap::Parser;
use commands::Cli;

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();
    commands::run(cli).await
}
