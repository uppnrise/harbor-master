use serde::{Deserialize, Serialize};

/// Represents a container image from Docker or Podman
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Image {
    /// Image ID (full SHA256 hash)
    pub id: String,

    /// Repository name (e.g., "nginx", "ubuntu")
    pub repository: String,

    /// Image tag (e.g., "latest", "20.04")
    pub tag: String,

    /// Image digest (SHA256 hash)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub digest: Option<String>,

    /// Image size in bytes
    pub size: u64,

    /// Creation timestamp (ISO 8601 format)
    pub created: String,

    /// Number of containers using this image
    #[serde(default)]
    pub containers: u32,

    /// Labels applied to the image
    #[serde(default)]
    pub labels: std::collections::HashMap<String, String>,
}

impl Image {
    /// Format size in human-readable format (e.g., "1.2 GB")
    #[allow(dead_code)] // Will be used in future UI features
    pub fn formatted_size(&self) -> String {
        format_bytes(self.size)
    }
}

/// Format bytes into human-readable size
#[allow(dead_code)] // Used by formatted_size method
fn format_bytes(bytes: u64) -> String {
    const UNITS: &[&str] = &["B", "KB", "MB", "GB", "TB"];

    if bytes == 0 {
        return "0 B".to_string();
    }

    let mut size = bytes as f64;
    let mut unit_index = 0;

    while size >= 1024.0 && unit_index < UNITS.len() - 1 {
        size /= 1024.0;
        unit_index += 1;
    }

    if unit_index == 0 {
        format!("{} {}", bytes, UNITS[unit_index])
    } else {
        format!("{:.1} {}", size, UNITS[unit_index])
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_bytes() {
        assert_eq!(format_bytes(0), "0 B");
        assert_eq!(format_bytes(512), "512 B");
        assert_eq!(format_bytes(1024), "1.0 KB");
        assert_eq!(format_bytes(1536), "1.5 KB");
        assert_eq!(format_bytes(1048576), "1.0 MB");
        assert_eq!(format_bytes(1073741824), "1.0 GB");
        assert_eq!(format_bytes(1099511627776), "1.0 TB");
    }

    #[test]
    fn test_formatted_size() {
        let image = Image {
            id: "sha256:abc123".to_string(),
            repository: "nginx".to_string(),
            tag: "latest".to_string(),
            digest: None,
            size: 142857216,
            created: "2024-01-15T10:30:00Z".to_string(),
            containers: 0,
            labels: std::collections::HashMap::new(),
        };

        assert_eq!(image.formatted_size(), "136.2 MB");
    }

    #[test]
    fn test_image_serialization() {
        let image = Image {
            id: "sha256:abc123".to_string(),
            repository: "nginx".to_string(),
            tag: "latest".to_string(),
            digest: Some("sha256:def456".to_string()),
            size: 142857216,
            created: "2024-01-15T10:30:00Z".to_string(),
            containers: 2,
            labels: [("version".to_string(), "1.0".to_string())]
                .iter()
                .cloned()
                .collect(),
        };

        let json = serde_json::to_string(&image).unwrap();
        let deserialized: Image = serde_json::from_str(&json).unwrap();

        assert_eq!(image, deserialized);
    }
}
