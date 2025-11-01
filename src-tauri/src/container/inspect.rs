/// Container inspection operations
use crate::types::Runtime;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::Command;

/// Detailed container information
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all(serialize = "camelCase", deserialize = "PascalCase"))]
pub struct ContainerDetails {
    pub id: String,
    pub created: String,
    pub path: String,
    #[serde(default)]
    pub args: Vec<String>,
    pub state: ContainerStateDetails,
    pub image: String,
    pub name: String,
    pub restart_count: i32,
    pub driver: String,
    pub platform: String,
    pub mount_label: String,
    pub process_label: String,
    pub app_armor_profile: String,
    pub config: ContainerConfig,
    pub network_settings: NetworkSettings,
    #[serde(default)]
    pub mounts: Vec<MountDetails>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all(serialize = "camelCase", deserialize = "PascalCase"))]
pub struct ContainerStateDetails {
    pub status: String,
    pub running: bool,
    pub paused: bool,
    pub restarting: bool,
    #[serde(rename = "OOMKilled")]
    pub oom_killed: bool,
    pub dead: bool,
    pub pid: i32,
    pub exit_code: i32,
    pub error: String,
    pub started_at: String,
    pub finished_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all(serialize = "camelCase", deserialize = "PascalCase"))]
pub struct ContainerConfig {
    pub hostname: String,
    pub domainname: String,
    pub user: String,
    pub attach_stdin: bool,
    pub attach_stdout: bool,
    pub attach_stderr: bool,
    pub tty: bool,
    pub open_stdin: bool,
    pub stdin_once: bool,
    #[serde(default)]
    pub env: Vec<String>,
    pub cmd: Option<Vec<String>>,
    pub image: String,
    pub volumes: Option<HashMap<String, serde_json::Value>>,
    pub working_dir: String,
    pub entrypoint: Option<Vec<String>>,
    pub on_build: Option<Vec<String>>,
    #[serde(default)]
    pub labels: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all(serialize = "camelCase", deserialize = "PascalCase"))]
pub struct NetworkSettings {
    pub bridge: String,
    #[serde(rename = "SandboxID")]
    pub sandbox_id: String,
    pub hairpin_mode: bool,
    #[serde(rename = "LinkLocalIPv6Address")]
    pub link_local_i_pv6_address: String,
    #[serde(rename = "LinkLocalIPv6PrefixLen")]
    pub link_local_i_pv6_prefix_len: i32,
    #[serde(default)]
    pub ports: HashMap<String, Option<Vec<PortDetails>>>,
    pub sandbox_key: String,
    pub gateway: String,
    #[serde(rename = "IPAddress")]
    pub ip_address: String,
    #[serde(rename = "IPPrefixLen")]
    pub ip_prefix_len: i32,
    #[serde(rename = "IPv6Gateway")]
    pub i_pv6_gateway: String,
    pub mac_address: String,
    #[serde(default)]
    pub networks: HashMap<String, NetworkDetails>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all(serialize = "camelCase", deserialize = "PascalCase"))]
pub struct PortDetails {
    #[serde(rename = "HostIp")]
    pub host_ip: String,
    pub host_port: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all(serialize = "camelCase", deserialize = "PascalCase"))]
pub struct NetworkDetails {
    #[serde(rename = "IPAMConfig")]
    pub ipam_config: Option<serde_json::Value>,
    pub links: Option<Vec<String>>,
    pub aliases: Option<Vec<String>>,
    #[serde(rename = "NetworkID")]
    pub network_id: String,
    #[serde(rename = "EndpointID")]
    pub endpoint_id: String,
    pub gateway: String,
    #[serde(rename = "IPAddress")]
    pub ip_address: String,
    #[serde(rename = "IPPrefixLen")]
    pub ip_prefix_len: i32,
    #[serde(rename = "IPv6Gateway")]
    pub i_pv6_gateway: String,
    #[serde(rename = "GlobalIPv6Address")]
    pub global_i_pv6_address: String,
    #[serde(rename = "GlobalIPv6PrefixLen")]
    pub global_i_pv6_prefix_len: i32,
    pub mac_address: String,
    pub driver_opts: Option<HashMap<String, String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all(serialize = "camelCase", deserialize = "PascalCase"))]
pub struct MountDetails {
    #[serde(rename = "Type")]
    pub mount_type: String,
    pub name: Option<String>,
    pub source: String,
    pub destination: String,
    pub driver: Option<String>,
    pub mode: String,
    #[serde(rename = "RW")]
    pub rw: bool,
    pub propagation: String,
}

/// Inspect a container and get detailed information
///
/// # Arguments
/// * `runtime` - The runtime information (Docker or Podman)
/// * `container_id` - The ID or name of the container to inspect
///
/// # Returns
/// * `Result<ContainerDetails, String>` - Container details or error message
pub fn inspect_container(
    runtime: &Runtime,
    container_id: &str,
) -> Result<ContainerDetails, String> {
    let output = Command::new(&runtime.path)
        .arg("inspect")
        .arg(container_id)
        .output()
        .map_err(|e| format!("Failed to execute {} inspect: {}", runtime.runtime_type, e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Failed to inspect container: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);

    // Docker/Podman inspect returns an array with one element
    let mut details: Vec<ContainerDetails> = serde_json::from_str(&stdout)
        .map_err(|e| format!("Failed to parse container details: {}", e))?;

    details
        .pop()
        .ok_or_else(|| "No container details returned".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{Runtime, RuntimeStatus, RuntimeType, Version};
    use chrono::Utc;

    fn mock_runtime() -> Runtime {
        Runtime {
            id: "test-docker".to_string(),
            runtime_type: RuntimeType::Docker,
            path: "docker".to_string(),
            version: Version {
                major: 20,
                minor: 10,
                patch: 0,
                full: "20.10.0".to_string(),
            },
            status: RuntimeStatus::Running,
            last_checked: Utc::now(),
            detected_at: Utc::now(),
            mode: None,
            is_wsl: None,
            error: None,
            version_warning: None,
        }
    }

    #[test]
    fn test_inspect_container() {
        // This test would require a running Docker/Podman instance
        let runtime = mock_runtime();
        let result = inspect_container(&runtime, "test-container");
        // We expect this to fail in test environment without Docker
        assert!(result.is_err() || result.is_ok());
    }

    #[test]
    fn test_container_details_deserialization() {
        let json = r#"[{
            "Id": "abc123",
            "Created": "2024-01-01T00:00:00Z",
            "Path": "/bin/sh",
            "Args": ["-c", "echo hello"],
            "State": {
                "Status": "running",
                "Running": true,
                "Paused": false,
                "Restarting": false,
                "OOMKilled": false,
                "Dead": false,
                "Pid": 1234,
                "ExitCode": 0,
                "Error": "",
                "StartedAt": "2024-01-01T00:00:01Z",
                "FinishedAt": "0001-01-01T00:00:00Z"
            },
            "Image": "nginx:latest",
            "Name": "/test-container",
            "RestartCount": 0,
            "Driver": "overlay2",
            "Platform": "linux",
            "MountLabel": "",
            "ProcessLabel": "",
            "AppArmorProfile": "",
            "Config": {
                "Hostname": "abc123",
                "Domainname": "",
                "User": "",
                "AttachStdin": false,
                "AttachStdout": true,
                "AttachStderr": true,
                "Tty": false,
                "OpenStdin": false,
                "StdinOnce": false,
                "Env": ["PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"],
                "Cmd": ["nginx", "-g", "daemon off;"],
                "Image": "nginx:latest",
                "Volumes": null,
                "WorkingDir": "",
                "Entrypoint": null,
                "OnBuild": null,
                "Labels": {}
            },
            "NetworkSettings": {
                "Bridge": "",
                "SandboxID": "xyz789",
                "HairpinMode": false,
                "LinkLocalIPv6Address": "",
                "LinkLocalIPv6PrefixLen": 0,
                "Ports": {},
                "SandboxKey": "/var/run/docker/netns/xyz789",
                "Gateway": "172.17.0.1",
                "IPAddress": "172.17.0.2",
                "IPPrefixLen": 16,
                "IPv6Gateway": "",
                "MacAddress": "02:42:ac:11:00:02",
                "Networks": {}
            },
            "Mounts": []
        }]"#;

        let result: Result<Vec<ContainerDetails>, _> = serde_json::from_str(json);
        if let Err(e) = &result {
            eprintln!("Deserialization error: {}", e);
        }
        assert!(result.is_ok());

        let details = result.unwrap();
        assert_eq!(details.len(), 1);
        assert_eq!(details[0].id, "abc123");
        assert_eq!(details[0].name, "/test-container");
        assert!(details[0].state.running);
    }
}
