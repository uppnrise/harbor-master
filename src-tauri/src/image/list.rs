use super::types::Image;
use crate::types::Runtime;
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
        return Err(format!("{} images failed: {}", runtime.runtime_type, stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    parse_images(&stdout)
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

        let raw: serde_json::Value = serde_json::from_str(line)
            .map_err(|e| format!("Failed to parse image JSON: {}", e))?;

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

    // Extract created timestamp
    let created = raw["CreatedAt"]
        .as_str()
        .or_else(|| raw["Created"].as_str())
        .unwrap_or("")
        .to_string();

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
        assert_eq!(image.created, "2024-01-15T10:30:00Z");
        assert_eq!(image.containers, 2);
        assert_eq!(image.labels.get("version"), Some(&"1.0".to_string()));
    }

    #[test]
    fn test_parse_image_object_repo_tags_format() {
        let json = serde_json::json!({
            "Id": "sha256:xyz789",
            "RepoTags": ["ubuntu:20.04"],
            "Size": 73000000,
            "Created": "2024-01-10T08:00:00Z"
        });

        let image = parse_image_object(&json).unwrap();
        
        assert_eq!(image.id, "sha256:xyz789");
        assert_eq!(image.repository, "ubuntu");
        assert_eq!(image.tag, "20.04");
        assert_eq!(image.size, 73000000);
        assert_eq!(image.created, "2024-01-10T08:00:00Z");
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
