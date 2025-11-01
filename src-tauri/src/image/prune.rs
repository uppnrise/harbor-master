use crate::types::Runtime;
use serde::{Deserialize, Serialize};
use std::process::Command;

/// Options for pruning images
#[derive(Debug, Clone, Default)]
pub struct PruneImageOptions {
    /// Prune all unused images, not just dangling ones
    pub all: bool,
}

/// Result of image pruning operation
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PruneResult {
    /// Number of images deleted
    pub images_deleted: u32,
    /// Total disk space reclaimed in bytes
    pub space_reclaimed: u64,
}

/// Prune unused images
pub fn prune_images(runtime: &Runtime, options: &PruneImageOptions) -> Result<PruneResult, String> {
    let mut cmd = Command::new(&runtime.path);
    cmd.args(["image", "prune", "-f"]); // -f to skip confirmation

    if options.all {
        cmd.arg("-a"); // Prune all unused images, not just dangling
    }

    let output = cmd.output().map_err(|e| {
        format!(
            "Failed to execute {} image prune: {}",
            runtime.runtime_type, e
        )
    })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Failed to prune images: {}", stderr));
    }

    // Parse output to extract statistics
    let stdout = String::from_utf8_lossy(&output.stdout);
    parse_prune_output(&stdout)
}

/// Parse the output from docker/podman image prune
fn parse_prune_output(output: &str) -> Result<PruneResult, String> {
    let mut images_deleted = 0u32;
    let mut space_reclaimed = 0u64;

    // Example output:
    // Deleted Images:
    // deleted: sha256:abc123...
    // deleted: sha256:def456...
    //
    // Total reclaimed space: 1.2GB

    for line in output.lines() {
        let line = line.trim();

        // Count deleted images
        if line.starts_with("deleted:") || line.starts_with("untagged:") {
            images_deleted += 1;
        }

        // Parse space reclaimed
        if line.contains("Total reclaimed space:") || line.contains("reclaimed") {
            // Extract the size part (e.g., "1.2GB", "500MB")
            if let Some(size_str) = line.split(':').nth(1) {
                space_reclaimed = parse_size_string(size_str.trim());
            }
        }
    }

    Ok(PruneResult {
        images_deleted,
        space_reclaimed,
    })
}

/// Parse a size string like "1.2GB" or "500MB" into bytes
fn parse_size_string(size_str: &str) -> u64 {
    let size_str = size_str.trim();

    // Extract number and unit
    let mut number_str = String::new();
    let mut unit_str = String::new();
    let mut in_number = true;

    for ch in size_str.chars() {
        if ch.is_numeric() || ch == '.' {
            if in_number {
                number_str.push(ch);
            }
        } else if ch.is_alphabetic() {
            in_number = false;
            unit_str.push(ch.to_ascii_uppercase());
        }
    }

    let number: f64 = number_str.parse().unwrap_or(0.0);

    // Convert to bytes based on unit
    let multiplier: u64 = match unit_str.as_str() {
        "B" => 1,
        "KB" | "K" => 1024,
        "MB" | "M" => 1024 * 1024,
        "GB" | "G" => 1024 * 1024 * 1024,
        "TB" | "T" => 1024 * 1024 * 1024 * 1024,
        _ => 1,
    };

    (number * multiplier as f64) as u64
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_size_string() {
        assert_eq!(parse_size_string("0B"), 0);
        assert_eq!(parse_size_string("1KB"), 1024);
        assert_eq!(parse_size_string("1.5KB"), 1536);
        assert_eq!(parse_size_string("1MB"), 1048576);
        assert_eq!(parse_size_string("1.2GB"), 1_288_490_188);
        assert_eq!(parse_size_string("500MB"), 524_288_000);
    }

    #[test]
    fn test_prune_result_deserialization() {
        let result = PruneResult {
            images_deleted: 5,
            space_reclaimed: 1_288_490_188,
        };

        let json = serde_json::to_string(&result).unwrap();
        let deserialized: PruneResult = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.images_deleted, 5);
        assert_eq!(deserialized.space_reclaimed, 1_288_490_188);
    }

    #[test]
    fn test_parse_prune_output() {
        let output = r#"
Deleted Images:
deleted: sha256:abc123
deleted: sha256:def456
untagged: myimage:latest

Total reclaimed space: 1.2GB
"#;

        let result = parse_prune_output(output).unwrap();
        assert_eq!(result.images_deleted, 3);
        assert_eq!(result.space_reclaimed, 1_288_490_188);
    }
}
