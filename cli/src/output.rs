use colored::Colorize;
use serde::Serialize;

#[derive(Debug, Clone, Copy, clap::ValueEnum)]
pub enum OutputFormat {
    Text,
    Json,
}

pub fn print_result<T: Serialize + std::fmt::Display>(value: &T, format: OutputFormat) {
    match format {
        OutputFormat::Text => println!("{value}"),
        OutputFormat::Json => {
            println!("{}", serde_json::to_string_pretty(value).unwrap());
        }
    }
}

pub fn print_json<T: Serialize>(value: &T, format: OutputFormat) {
    match format {
        OutputFormat::Text => {
            println!("{}", serde_json::to_string_pretty(value).unwrap());
        }
        OutputFormat::Json => {
            println!("{}", serde_json::to_string_pretty(value).unwrap());
        }
    }
}

pub fn print_success(msg: &str) {
    println!("{} {msg}", "✓".green().bold());
}

pub fn print_error(msg: &str) {
    eprintln!("{} {msg}", "✗".red().bold());
}

pub fn print_table(headers: &[&str], rows: &[Vec<String>]) {
    if rows.is_empty() {
        println!("  (none)");
        return;
    }

    // Calculate column widths
    let mut widths: Vec<usize> = headers.iter().map(|h| h.len()).collect();
    for row in rows {
        for (i, cell) in row.iter().enumerate() {
            if i < widths.len() {
                widths[i] = widths[i].max(cell.len());
            }
        }
    }

    // Print header
    let header_line: Vec<String> = headers
        .iter()
        .enumerate()
        .map(|(i, h)| format!("{:<width$}", h, width = widths[i]))
        .collect();
    println!("  {}", header_line.join("  ").bold());
    let separator: Vec<String> = widths.iter().map(|w| "─".repeat(*w)).collect();
    println!("  {}", separator.join("──").dimmed());

    // Print rows
    for row in rows {
        let cells: Vec<String> = row
            .iter()
            .enumerate()
            .map(|(i, cell)| {
                let width = widths.get(i).copied().unwrap_or(cell.len());
                format!("{:<width$}", cell, width = width)
            })
            .collect();
        println!("  {}", cells.join("  "));
    }
}
