use super::types::Image;
use crate::types::Runtime;
use chrono::{DateTime, Utc};
use std::collections::HashMap;
use std::process::Command;

/// List all images for the specified runtime
pub fn list_images(runtime: &Runtime) -> Result<Vec<Image>, String> {
    // Use `images --format json` for structured output
    let output = Command::new(&runtime.path)
        .args(["images", "--format", "json"])
        .output()
        .map_err(|e| format!("Failed to execute {} images: {}", runtime.runtime_type, e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!(
            "{} images failed: {}",
            runtime.runtime_type, stderr
        ));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut images = parse_images(&stdout)?;
    
    // Get container counts for each image
    if let Ok(container_counts) = get_container_counts(runtime) {
        for image in &mut images {
            if let Some(&count) = container_counts.get(&image.id) {
                image.containers = count;
            }
        }
    }
    
    Ok(images)
}

/// Get the number of containers using each image
fn get_container_counts(runtime: &Runtime) -> Result<HashMap<String, u32>, String> {
    let output = Command::new(&runtime.path)
        .args(["ps", "-a", "--format", "{{.Image}}\t{{.ID}}"])
        .output()
        .map_err(|e| format!("Failed to execute {} ps: {}", runtime.runtime_type, e))?;

    if !output.status.success() {
        // Non-critical error, return empty map
        return Ok(HashMap::new());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut counts: HashMap<String, u32> = HashMap::new();
    
    // Also need to map image names to IDs
    let image_name_to_id = get_image_name_to_id_map(runtime)?;
    
    for line in stdout.lines() {
        let parts: Vec<&str> = line.split('\t').collect();
        if parts.len() >= 1 {
            let image_ref = parts[0].trim();
            if !image_ref.is_empty() {
                // Try to find the image ID from the reference
                if let Some(image_id) = image_name_to_id.get(image_ref) {
                    *counts.entry(image_id.clone()).or_insert(0) += 1;
                }
            }
        }
    }

    Ok(counts)
}

/// Get a mapping of image references (repo:tag or ID) to full image IDs
fn get_image_name_to_id_map(runtime: &Runtime) -> Result<HashMap<String, String>, String> {
    let output = Command::new(&runtime.path)
        .args(["images", "--format", "{{.Repository}}:{{.Tag}}\t{{.ID}}"])
        .output()
        .map_err(|e| format!("Failed to execute {} images: {}", runtime.runtime_type, e))?;

    if !output.status.success() {
        return Ok(HashMap::new());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut map = HashMap::new();
    
    for line in stdout.lines() {
        let parts: Vec<&str> = line.split('\t').collect();
        if parts.len() >= 2 {
            let name = parts[0].trim().to_string();
            let id = parts[1].trim().to_string();
            
            // Add both the full name and just the ID prefix as keys
            map.insert(name.clone(), id.clone());
            map.insert(id[..12.min(id.len())].to_string(), id.clone());
            
            // Also add just the repo name without tag for matching
            if let Some(repo) = name.split(':').next() {
                if !repo.is_empty() && repo != "<none>" {
                    map.insert(repo.to_string(), id.clone());
                }
            }
        }
    }

    Ok(map)
}

/// Parse JSON output from `docker/podman images --format json`
fn parse_images(output: &str) -> Result<Vec<Image>, String> {
    let mut images = Vec::new();

    // Each line is a separate JSON object
    for line in output.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }

        let raw: serde_json::Value =
            serde_json::from_str(line).map_err(|e| format!("Failed to parse image JSON: {}", e))?;

        let image = parse_image_object(&raw)?;
        images.push(image);
    }

    Ok(images)
}

/// Parse a single image JSON object
fn parse_image_object(raw: &serde_json::Value) -> Result<Image, String> {
    // Extract ID
    let id = raw["Id"]
        .as_str()
        .or_else(|| raw["ID"].as_str())
        .unwrap_or("")
        .to_string();

    // Extract repository and tag from RepoTags array or Repository/Tag fields
    let (repository, tag) = if let Some(repo_tags) = raw["RepoTags"].as_array() {
        if let Some(first_tag) = repo_tags.first().and_then(|v| v.as_str()) {
            parse_repo_tag(first_tag)
        } else {
            ("<none>".to_string(), "<none>".to_string())
        }
    } else {
        let repo = raw["Repository"].as_str().unwrap_or("<none>").to_string();
        let tag_val = raw["Tag"].as_str().unwrap_or("<none>").to_string();
        (repo, tag_val)
    };

    // Extract digest
    let digest = raw["Digest"]
        .as_str()
        .filter(|s| !s.is_empty() && *s != "<none>")
        .map(String::from);

    // Extract size (in bytes)
    let size = raw["Size"]
        .as_u64()
        .or_else(|| raw["VirtualSize"].as_u64())
        .unwrap_or(0);

    // Extract created timestamp and normalize to ISO 8601
    let created = raw
        .get("CreatedAt")
        .and_then(|v| v.as_str())
        .and_then(normalize_timestamp)
        .unwrap_or_else(|| {
            raw.get("CreatedAt")
                .and_then(|v| v.as_str())
                .unwrap_or("unknown")
                .to_string()
        });

    // Extract containers count (may not be available in all runtimes)
    let containers = raw["Containers"].as_u64().unwrap_or(0) as u32;

    // Extract labels
    let labels = if let Some(labels_obj) = raw["Labels"].as_object() {
        labels_obj
            .iter()
            .filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string())))
            .collect()
    } else {
        HashMap::new()
    };

    Ok(Image {
        id,
        repository,
        tag,
        digest,
        size,
        created,
        containers,
        labels,
    })
}

/// Parse "repository:tag" format into separate components
fn parse_repo_tag(repo_tag: &str) -> (String, String) {
    if let Some(colon_idx) = repo_tag.rfind(':') {
        let repo = repo_tag[..colon_idx].to_string();
        let tag = repo_tag[colon_idx + 1..].to_string();
        (repo, tag)
    } else {
        (repo_tag.to_string(), "latest".to_string())
    }
}

/// Normalize timestamp to ISO 8601 format
/// Handles various Docker/Podman timestamp formats
fn normalize_timestamp(timestamp: &str) -> Option<String> {
    // Try parsing as RFC3339 (ISO 8601) first
    if let Ok(dt) = DateTime::parse_from_rfc3339(timestamp) {
        return Some(dt.to_rfc3339());
    }

    // Try parsing common Docker formats
    // Format: "2024-01-15 10:30:45 +0000 UTC"
    if let Ok(dt) = DateTime::parse_from_str(timestamp, "%Y-%m-%d %H:%M:%S %z %Z") {
        return Some(dt.to_rfc3339());
    }

    // Format: "2024-01-15T10:30:45Z"
    if let Ok(dt) = timestamp.parse::<DateTime<Utc>>() {
        return Some(dt.to_rfc3339());
    }

    // If all parsing fails, return None
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_repo_tag() {
        assert_eq!(
            parse_repo_tag("nginx:latest"),
            ("nginx".to_string(), "latest".to_string())
        );
        assert_eq!(
            parse_repo_tag("ubuntu:20.04"),
            ("ubuntu".to_string(), "20.04".to_string())
        );
        assert_eq!(
            parse_repo_tag("registry.example.com:5000/myapp:v1.0"),
            (
                "registry.example.com:5000/myapp".to_string(),
                "v1.0".to_string()
            )
        );
        assert_eq!(
            parse_repo_tag("alpine"),
            ("alpine".to_string(), "latest".to_string())
        );
    }

    #[test]
    fn test_parse_image_object_docker_format() {
        let json = serde_json::json!({
            "ID": "sha256:abc123",
            "Repository": "nginx",
            "Tag": "latest",
            "Digest": "sha256:def456",
            "Size": 142857216,
            "CreatedAt": "2024-01-15T10:30:00Z",
            "Containers": 2,
            "Labels": {
                "version": "1.0"
            }
        });

        let image = parse_image_object(&json).unwrap();

        assert_eq!(image.id, "sha256:abc123");
        assert_eq!(image.repository, "nginx");
        assert_eq!(image.tag, "latest");
        assert_eq!(image.digest, Some("sha256:def456".to_string()));
        assert_eq!(image.size, 142857216);
        assert_eq!(image.created, "2024-01-15T10:30:00+00:00"); // RFC3339 format
        assert_eq!(image.containers, 2);
        assert_eq!(image.labels.get("version"), Some(&"1.0".to_string()));
    }

    #[test]
    fn test_parse_image_object_repo_tags_format() {
        let json = serde_json::json!({
            "Id": "sha256:xyz789",
            "RepoTags": ["ubuntu:20.04"],
            "Size": 73000000,
            "CreatedAt": "2024-01-10T08:00:00Z"
        });

        let image = parse_image_object(&json).unwrap();

        assert_eq!(image.id, "sha256:xyz789");
        assert_eq!(image.repository, "ubuntu");
        assert_eq!(image.tag, "20.04");
        assert_eq!(image.size, 73000000);
        assert_eq!(image.created, "2024-01-10T08:00:00+00:00"); // RFC3339 format
    }

    #[test]
    fn test_parse_image_object_no_tags() {
        let json = serde_json::json!({
            "ID": "sha256:dangling123",
            "Repository": "<none>",
            "Tag": "<none>",
            "Size": 1000000,
            "CreatedAt": "2024-01-01T00:00:00Z"
        });

        let image = parse_image_object(&json).unwrap();

        assert_eq!(image.repository, "<none>");
        assert_eq!(image.tag, "<none>");
    }

    #[test]
    fn test_parse_images_multiple_lines() {
        let output = r#"{"ID":"sha256:abc123","Repository":"nginx","Tag":"latest","Size":142857216,"CreatedAt":"2024-01-15T10:30:00Z"}
{"ID":"sha256:xyz789","Repository":"ubuntu","Tag":"20.04","Size":73000000,"CreatedAt":"2024-01-10T08:00:00Z"}"#;

        let images = parse_images(output).unwrap();

        assert_eq!(images.len(), 2);
        assert_eq!(images[0].repository, "nginx");
        assert_eq!(images[1].repository, "ubuntu");
    }

    #[test]
    fn test_parse_images_empty_lines() {
        let output = r#"
{"ID":"sha256:abc123","Repository":"nginx","Tag":"latest","Size":142857216,"CreatedAt":"2024-01-15T10:30:00Z"}

{"ID":"sha256:xyz789","Repository":"ubuntu","Tag":"20.04","Size":73000000,"CreatedAt":"2024-01-10T08:00:00Z"}
"#;

        let images = parse_images(output).unwrap();

        assert_eq!(images.len(), 2);
    }
}
