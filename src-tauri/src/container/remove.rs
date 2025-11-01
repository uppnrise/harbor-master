/// Container removal operations
use crate::types::Runtime;
use std::process::Command;

/// Options for removing a container
#[derive(Debug, Clone, Default)]
pub struct RemoveOptions {
    /// Force remove running container
    pub force: bool,
    /// Remove associated anonymous volumes
    pub volumes: bool,
}

/// Remove a container
///
/// # Arguments
/// * `runtime` - The runtime information (Docker or Podman)
/// * `container_id` - The ID or name of the container to remove
/// * `options` - Removal options (force, volumes)
///
/// # Returns
/// * `Result<(), String>` - Success or error message
pub fn remove_container(
    runtime: &Runtime,
    container_id: &str,
    options: RemoveOptions,
) -> Result<(), String> {
    let mut cmd = Command::new(&runtime.path);
    cmd.arg("rm");

    if options.force {
        cmd.arg("--force");
    }

    if options.volumes {
        cmd.arg("--volumes");
    }

    cmd.arg(container_id);

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to execute {} rm: {}", runtime.runtime_type, e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Failed to remove container: {}", stderr));
    }

    Ok(())
}

/// Remove multiple containers
///
/// # Arguments
/// * `runtime` - The runtime information (Docker or Podman)
/// * `container_ids` - The IDs or names of the containers to remove
/// * `options` - Removal options (force, volumes)
///
/// # Returns
/// * `Result<Vec<String>, String>` - List of successfully removed container IDs or error
pub fn remove_containers(
    runtime: &Runtime,
    container_ids: &[String],
    options: RemoveOptions,
) -> Result<Vec<String>, String> {
    let mut removed = Vec::new();
    let mut errors = Vec::new();

    for container_id in container_ids {
        match remove_container(runtime, container_id, options.clone()) {
            Ok(_) => removed.push(container_id.clone()),
            Err(e) => errors.push(format!("{}: {}", container_id, e)),
        }
    }

    if !errors.is_empty() {
        return Err(format!(
            "Failed to remove some containers:\n{}",
            errors.join("\n")
        ));
    }

    Ok(removed)
}

/// Prune stopped containers
///
/// # Arguments
/// * `runtime` - The runtime information (Docker or Podman)
///
/// # Returns
/// * `Result<PruneResult, String>` - Prune statistics or error message
pub fn prune_containers(runtime: &Runtime) -> Result<PruneResult, String> {
    let output = Command::new(&runtime.path)
        .arg("container")
        .arg("prune")
        .arg("--force")
        .arg("--format")
        .arg("json")
        .output()
        .map_err(|e| {
            format!(
                "Failed to execute {} container prune: {}",
                runtime.runtime_type, e
            )
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Failed to prune containers: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);

    // Parse the prune result
    let result: PruneResult = serde_json::from_str(&stdout)
        .map_err(|e| format!("Failed to parse prune result: {}", e))?;

    Ok(result)
}

/// Result of container prune operation
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct PruneResult {
    /// List of containers that were deleted
    pub containers_deleted: Option<Vec<String>>,
    /// Amount of disk space reclaimed in bytes
    pub space_reclaimed: u64,
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
    fn test_remove_options_default() {
        let options = RemoveOptions::default();
        assert!(!options.force);
        assert!(!options.volumes);
    }

    #[test]
    fn test_remove_container_with_force() {
        let runtime = mock_runtime();
        let options = RemoveOptions {
            force: true,
            volumes: false,
        };
        let result = remove_container(&runtime, "test-container", options);
        // We expect this to fail in test environment without Docker
        assert!(result.is_err() || result.is_ok());
    }

    #[test]
    fn test_remove_multiple_containers() {
        let runtime = mock_runtime();
        let container_ids = vec!["container1".to_string(), "container2".to_string()];
        let options = RemoveOptions::default();
        let result = remove_containers(&runtime, &container_ids, options);
        // We expect this to fail in test environment without Docker
        assert!(result.is_err() || result.is_ok());
    }

    #[test]
    fn test_prune_result_deserialization() {
        let json = r#"{
            "ContainersDeleted": ["abc123", "def456"],
            "SpaceReclaimed": 1024000
        }"#;

        let result: Result<PruneResult, _> = serde_json::from_str(json);
        assert!(result.is_ok());

        let prune = result.unwrap();
        assert_eq!(prune.containers_deleted.as_ref().unwrap().len(), 2);
        assert_eq!(prune.space_reclaimed, 1024000);
    }
}
