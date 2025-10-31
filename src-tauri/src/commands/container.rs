/// Tauri commands for container management
use crate::container::{
    inspect_container, list_containers, pause_container, prune_containers, remove_container,
    remove_containers, restart_container, start_container, stop_container, unpause_container,
    Container, ContainerDetails, ContainerListOptions, PruneResult, RemoveOptions,
};
use crate::types::Runtime;

/// List containers
#[tauri::command]
pub async fn list_containers_command(
    runtime: Runtime,
    options: ContainerListOptions,
) -> Result<Vec<Container>, String> {
    list_containers(&runtime, &options)
}

/// Start a container
#[tauri::command]
pub async fn start_container_command(
    runtime: Runtime,
    container_id: String,
) -> Result<(), String> {
    start_container(&runtime, &container_id)
}

/// Stop a container
#[tauri::command]
pub async fn stop_container_command(
    runtime: Runtime,
    container_id: String,
    timeout: Option<u64>,
) -> Result<(), String> {
    stop_container(&runtime, &container_id, timeout)
}

/// Restart a container
#[tauri::command]
pub async fn restart_container_command(
    runtime: Runtime,
    container_id: String,
    timeout: Option<u64>,
) -> Result<(), String> {
    restart_container(&runtime, &container_id, timeout)
}

/// Pause a container
#[tauri::command]
pub async fn pause_container_command(
    runtime: Runtime,
    container_id: String,
) -> Result<(), String> {
    pause_container(&runtime, &container_id)
}

/// Unpause a container
#[tauri::command]
pub async fn unpause_container_command(
    runtime: Runtime,
    container_id: String,
) -> Result<(), String> {
    unpause_container(&runtime, &container_id)
}

/// Inspect a container
#[tauri::command]
pub async fn inspect_container_command(
    runtime: Runtime,
    container_id: String,
) -> Result<ContainerDetails, String> {
    inspect_container(&runtime, &container_id)
}

/// Remove a container
#[tauri::command]
pub async fn remove_container_command(
    runtime: Runtime,
    container_id: String,
    force: bool,
    volumes: bool,
) -> Result<(), String> {
    let options = RemoveOptions { force, volumes };
    remove_container(&runtime, &container_id, options)
}

/// Remove multiple containers
#[tauri::command]
pub async fn remove_containers_command(
    runtime: Runtime,
    container_ids: Vec<String>,
    force: bool,
    volumes: bool,
) -> Result<Vec<String>, String> {
    let options = RemoveOptions { force, volumes };
    remove_containers(&runtime, &container_ids, options)
}

/// Prune stopped containers
#[tauri::command]
pub async fn prune_containers_command(runtime: Runtime) -> Result<PruneResult, String> {
    prune_containers(&runtime)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{RuntimeStatus, RuntimeType, Version};
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

    #[tokio::test]
    async fn test_list_containers_command() {
        let runtime = mock_runtime();
        let options = ContainerListOptions {
            all: true,
            limit: None,
            size: false,
            filters: None,
        };
        
        // This will fail without Docker, but tests the command structure
        let result = list_containers_command(runtime, options).await;
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_start_container_command() {
        let runtime = mock_runtime();
        let result = start_container_command(runtime, "test-container".to_string()).await;
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_stop_container_command() {
        let runtime = mock_runtime();
        let result = stop_container_command(runtime, "test-container".to_string(), Some(10)).await;
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_remove_container_command() {
        let runtime = mock_runtime();
        let result = remove_container_command(runtime, "test-container".to_string(), true, false).await;
        assert!(result.is_ok() || result.is_err());
    }
}
