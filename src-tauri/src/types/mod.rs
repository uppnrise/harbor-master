use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum RuntimeType {
    Docker,
    Podman,
}

impl fmt::Display for RuntimeType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            RuntimeType::Docker => write!(f, "Docker"),
            RuntimeType::Podman => write!(f, "Podman"),
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum RuntimeStatus {
    Running,
    Stopped,
    Error,
    Unknown,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PodmanMode {
    Rootful,
    Rootless,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Version {
    pub major: u32,
    pub minor: u32,
    pub patch: u32,
    pub full: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Runtime {
    pub id: String,
    #[serde(rename = "type")]
    pub runtime_type: RuntimeType,
    pub path: String,
    pub version: Version,
    pub status: RuntimeStatus,
    #[serde(rename = "lastChecked")]
    pub last_checked: DateTime<Utc>,
    #[serde(rename = "detectedAt")]
    pub detected_at: DateTime<Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mode: Option<PodmanMode>,
    #[serde(skip_serializing_if = "Option::is_none", rename = "isWsl")]
    pub is_wsl: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", rename = "versionWarning")]
    pub version_warning: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectionResult {
    pub runtimes: Vec<Runtime>,
    #[serde(rename = "detectedAt")]
    pub detected_at: DateTime<Utc>,
    pub duration: u64, // milliseconds
    pub errors: Vec<DetectionError>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectionError {
    pub runtime: RuntimeType,
    pub path: String,
    pub error: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatusUpdate {
    #[serde(rename = "runtimeId")]
    pub runtime_id: String,
    pub status: RuntimeStatus,
    pub timestamp: DateTime<Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RuntimePreferences {
    #[serde(
        skip_serializing_if = "Option::is_none",
        rename = "selectedRuntimeId",
        alias = "selected_runtime_id"
    )]
    pub selected_runtime_id: Option<String>,
    #[serde(rename = "autoSelectRunning", alias = "auto_select_running")]
    pub auto_select_running: bool,
    #[serde(
        skip_serializing_if = "Option::is_none",
        rename = "preferredType",
        alias = "preferred_type"
    )]
    pub preferred_type: Option<RuntimeType>,
    #[serde(rename = "detectionCacheTTL", alias = "detection_cache_ttl")]
    pub detection_cache_ttl: u64, // seconds
    #[serde(rename = "statusPollInterval", alias = "status_poll_interval")]
    pub status_poll_interval: u64, // seconds
}

impl Default for RuntimePreferences {
    fn default() -> Self {
        Self {
            selected_runtime_id: None,
            auto_select_running: true,
            preferred_type: Some(RuntimeType::Docker),
            detection_cache_ttl: 60,
            status_poll_interval: 5,
        }
    }
}
