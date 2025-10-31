/// Container type definitions
use serde::{Deserialize, Serialize};

/// Container state enumeration
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ContainerState {
    Created,
    Running,
    Paused,
    Restarting,
    Removing,
    Exited,
    Dead,
}

/// Container status information
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContainerStatus {
    pub state: ContainerState,
    pub status: String,
    pub running: bool,
    pub paused: bool,
    pub restarting: bool,
    pub oom_killed: bool,
    pub dead: bool,
    pub pid: i64,
    pub exit_code: i32,
    pub error: String,
    pub started_at: String,
    pub finished_at: String,
}

/// Port binding information
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PortBinding {
    pub container_port: u16,
    pub host_port: u16,
    pub protocol: String,
    pub host_ip: String,
}

/// Container network information
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContainerNetwork {
    pub network_id: String,
    pub endpoint_id: String,
    pub gateway: String,
    pub ip_address: String,
    pub ip_prefix_len: i64,
    pub mac_address: String,
}

/// Mount information
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Mount {
    pub r#type: String,
    pub source: String,
    pub destination: String,
    pub mode: String,
    pub rw: bool,
    pub propagation: String,
}

/// Container information
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Container {
    pub id: String,
    pub name: String,
    pub image: String,
    pub image_id: String,
    pub command: String,
    pub created: i64,
    pub state: ContainerState,
    pub status: String,
    pub ports: Vec<PortBinding>,
    pub labels: std::collections::HashMap<String, String>,
    pub size_rw: Option<i64>,
    pub size_root_fs: Option<i64>,
    pub networks: std::collections::HashMap<String, ContainerNetwork>,
    pub mounts: Vec<Mount>,
}

/// Container list filter options
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ContainerListOptions {
    pub all: bool,
    pub limit: Option<i64>,
    pub size: bool,
    pub filters: Option<std::collections::HashMap<String, Vec<String>>>,
}

impl Default for ContainerState {
    fn default() -> Self {
        ContainerState::Created
    }
}

impl std::fmt::Display for ContainerState {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ContainerState::Created => write!(f, "created"),
            ContainerState::Running => write!(f, "running"),
            ContainerState::Paused => write!(f, "paused"),
            ContainerState::Restarting => write!(f, "restarting"),
            ContainerState::Removing => write!(f, "removing"),
            ContainerState::Exited => write!(f, "exited"),
            ContainerState::Dead => write!(f, "dead"),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_container_state_display() {
        assert_eq!(ContainerState::Running.to_string(), "running");
        assert_eq!(ContainerState::Exited.to_string(), "exited");
        assert_eq!(ContainerState::Paused.to_string(), "paused");
    }

    #[test]
    fn test_container_state_default() {
        assert_eq!(ContainerState::default(), ContainerState::Created);
    }

    #[test]
    fn test_container_serialization() {
        let container = Container {
            id: "abc123".to_string(),
            name: "test-container".to_string(),
            image: "nginx:latest".to_string(),
            image_id: "sha256:123".to_string(),
            command: "nginx -g daemon off;".to_string(),
            created: 1234567890,
            state: ContainerState::Running,
            status: "Up 2 hours".to_string(),
            ports: vec![],
            labels: std::collections::HashMap::new(),
            size_rw: Some(1024),
            size_root_fs: Some(2048),
            networks: std::collections::HashMap::new(),
            mounts: vec![],
        };

        let json = serde_json::to_string(&container).unwrap();
        assert!(json.contains("abc123"));
        assert!(json.contains("test-container"));
    }
}
