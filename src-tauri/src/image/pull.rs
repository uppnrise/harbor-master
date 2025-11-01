//! Image pulling operations
//! Handles pulling images from Docker registries with progress tracking

use serde::{Deserialize, Serialize};
use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};
use tauri::{AppHandle, Emitter};

use crate::types::Runtime;

/// Options for pulling an image
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PullImageOptions {
    /// Image name (e.g., "nginx", "docker.io/library/nginx")
    pub image_name: String,
    /// Image tag (e.g., "latest", "1.21")
    pub tag: String,
    /// Optional authentication (username:password or token)
    pub auth: Option<String>,
}

/// Progress status for an image layer
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LayerProgress {
    /// Layer ID
    pub id: String,
    /// Status message (e.g., "Downloading", "Download complete", "Pull complete")
    pub status: String,
    /// Current progress (bytes downloaded)
    pub current: Option<u64>,
    /// Total size (bytes)
    pub total: Option<u64>,
}

/// Overall pull progress
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PullProgress {
    /// Image being pulled
    pub image: String,
    /// Individual layer progress
    pub layers: Vec<LayerProgress>,
    /// Overall status message
    pub message: String,
    /// Whether pull is complete
    pub complete: bool,
}

/// Pull an image from a registry
/// 
/// # Arguments
/// * `runtime` - Docker or Podman runtime
/// * `options` - Pull options (image name, tag, auth)
/// * `app_handle` - Tauri app handle for emitting progress events
/// 
/// # Returns
/// * `Ok(())` if pull succeeds
/// * `Err(String)` with error message if pull fails
pub fn pull_image(
    runtime: &Runtime,
    options: &PullImageOptions,
    app_handle: &AppHandle,
) -> Result<(), String> {
    let image_ref = format!("{}:{}", options.image_name, options.tag);
    
    // Build command
    let mut cmd = Command::new(&runtime.path);
    cmd.arg("pull");
    cmd.arg(&image_ref);
    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped());
    
    // Add authentication if provided
    if let Some(auth) = &options.auth {
        // For Docker, use --username and --password
        // For Podman, similar approach
        // Note: This is simplified - production should use credential helpers
        if auth.contains(':') {
            let parts: Vec<&str> = auth.split(':').collect();
            if parts.len() == 2 {
                cmd.arg("--username").arg(parts[0]);
                cmd.arg("--password").arg(parts[1]);
            }
        }
    }
    
    // Spawn process
    let mut child = cmd.spawn().map_err(|e| format!("Failed to spawn pull command: {}", e))?;
    
    // Read stdout for progress updates
    if let Some(stdout) = child.stdout.take() {
        let reader = BufReader::new(stdout);
        let app_handle_clone = app_handle.clone();
        let image_ref_clone = image_ref.clone();
        
        // Parse progress in separate thread
        std::thread::spawn(move || {
            let mut layers: Vec<LayerProgress> = Vec::new();
            
            for line in reader.lines().map_while(Result::ok) {
                if let Some(progress) = parse_pull_progress(&line) {
                    // Update or add layer
                    if let Some(existing) = layers.iter_mut().find(|l| l.id == progress.id) {
                        *existing = progress;
                    } else {
                        layers.push(progress);
                    }
                    
                    // Emit progress event
                    let overall_progress = PullProgress {
                        image: image_ref_clone.clone(),
                        layers: layers.clone(),
                        message: line.clone(),
                        complete: false,
                    };
                    
                    let _ = app_handle_clone.emit("image-pull-progress", overall_progress);
                }
            }
            
            // Emit completion event
            let completion = PullProgress {
                image: image_ref_clone,
                layers,
                message: "Pull complete".to_string(),
                complete: true,
            };
            let _ = app_handle_clone.emit("image-pull-progress", completion);
        });
    }
    
    // Wait for process to complete
    let status = child.wait().map_err(|e| format!("Failed to wait for pull command: {}", e))?;
    
    if !status.success() {
        return Err(format!("Failed to pull image: {}", image_ref));
    }
    
    Ok(())
}

/// Parse progress from a docker pull output line
/// 
/// Docker pull output format examples:
/// - "a1b2c3d4e5f6: Pulling fs layer"
/// - "a1b2c3d4e5f6: Downloading [==>                ] 1.5MB/10MB"
/// - "a1b2c3d4e5f6: Download complete"
/// - "a1b2c3d4e5f6: Pull complete"
fn parse_pull_progress(line: &str) -> Option<LayerProgress> {
    // Split on first colon to get layer ID and status
    let parts: Vec<&str> = line.splitn(2, ':').collect();
    if parts.len() != 2 {
        return None;
    }
    
    let id = parts[0].trim().to_string();
    let status_part = parts[1].trim();
    
    // Check if this is a layer status line (12-character hex ID)
    if id.len() != 12 || !id.chars().all(|c| c.is_ascii_hexdigit()) {
        return None;
    }
    
    // Parse status and progress
    let status = if status_part.contains('[') {
        // Progress line: "Downloading [==>    ] 1.5MB/10MB"
        if let Some(progress_part) = status_part.split(']').nth(1) {
            // Extract bytes
            let (current, total) = parse_bytes_progress(progress_part.trim());
            return Some(LayerProgress {
                id,
                status: if status_part.starts_with("Downloading") {
                    "Downloading".to_string()
                } else if status_part.starts_with("Extracting") {
                    "Extracting".to_string()
                } else {
                    "Processing".to_string()
                },
                current,
                total,
            });
        }
        status_part.to_string()
    } else {
        status_part.to_string()
    };
    
    Some(LayerProgress {
        id,
        status,
        current: None,
        total: None,
    })
}

/// Parse bytes from progress string like "1.5MB/10MB"
fn parse_bytes_progress(s: &str) -> (Option<u64>, Option<u64>) {
    let parts: Vec<&str> = s.split('/').collect();
    if parts.len() != 2 {
        return (None, None);
    }
    
    let current = parse_size_to_bytes(parts[0].trim());
    let total = parse_size_to_bytes(parts[1].trim());
    
    (current, total)
}

/// Parse size string to bytes (e.g., "1.5MB" -> bytes)
fn parse_size_to_bytes(s: &str) -> Option<u64> {
    let s = s.trim();
    let mut number_str = String::new();
    let mut unit_str = String::new();
    
    for c in s.chars() {
        if c.is_numeric() || c == '.' {
            number_str.push(c);
        } else {
            unit_str.push(c);
        }
    }
    
    let number: f64 = number_str.parse().ok()?;
    
    let multiplier: u64 = match unit_str.trim().to_uppercase().as_str() {
        "B" => 1,
        "KB" | "K" => 1024,
        "MB" | "M" => 1024 * 1024,
        "GB" | "G" => 1024 * 1024 * 1024,
        _ => 1,
    };
    
    Some((number * multiplier as f64) as u64)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_pull_progress_pulling() {
        let line = "a1b2c3d4e5f6: Pulling fs layer";
        let progress = parse_pull_progress(line).unwrap();
        assert_eq!(progress.id, "a1b2c3d4e5f6");
        assert_eq!(progress.status, "Pulling fs layer");
        assert_eq!(progress.current, None);
        assert_eq!(progress.total, None);
    }

    #[test]
    fn test_parse_pull_progress_downloading() {
        let line = "a1b2c3d4e5f6: Downloading [==>                ] 1.5MB/10MB";
        let progress = parse_pull_progress(line).unwrap();
        assert_eq!(progress.id, "a1b2c3d4e5f6");
        assert_eq!(progress.status, "Downloading");
        assert!(progress.current.is_some());
        assert!(progress.total.is_some());
    }

    #[test]
    fn test_parse_pull_progress_complete() {
        let line = "a1b2c3d4e5f6: Pull complete";
        let progress = parse_pull_progress(line).unwrap();
        assert_eq!(progress.id, "a1b2c3d4e5f6");
        assert_eq!(progress.status, "Pull complete");
    }

    #[test]
    fn test_parse_pull_progress_invalid() {
        let line = "Status: Downloaded newer image";
        let progress = parse_pull_progress(line);
        assert!(progress.is_none());
    }

    #[test]
    fn test_parse_size_to_bytes() {
        assert_eq!(parse_size_to_bytes("1KB"), Some(1024));
        assert_eq!(parse_size_to_bytes("1.5MB"), Some(1_572_864));
        assert_eq!(parse_size_to_bytes("10MB"), Some(10_485_760));
        assert_eq!(parse_size_to_bytes("1GB"), Some(1_073_741_824));
    }

    #[test]
    fn test_pull_options_serialization() {
        let options = PullImageOptions {
            image_name: "nginx".to_string(),
            tag: "latest".to_string(),
            auth: None,
        };
        
        let json = serde_json::to_string(&options).unwrap();
        let deserialized: PullImageOptions = serde_json::from_str(&json).unwrap();
        
        assert_eq!(deserialized.image_name, "nginx");
        assert_eq!(deserialized.tag, "latest");
    }
}
