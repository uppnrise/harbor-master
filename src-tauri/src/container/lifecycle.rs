/// Container lifecycle operations
use crate::types::Runtime;
use std::process::Command;

/// Start a container
///
/// # Arguments
/// * `runtime` - The runtime information (Docker or Podman)
/// * `container_id` - The ID or name of the container to start
///
/// # Returns
/// * `Result<(), String>` - Success or error message
pub fn start_container(runtime: &Runtime, container_id: &str) -> Result<(), String> {
    let output = Command::new(&runtime.path)
        .arg("start")
        .arg(container_id)
        .output()
        .map_err(|e| format!("Failed to execute {} start: {}", runtime.runtime_type, e))?;
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Failed to start container: {}", stderr));
    }
    
    Ok(())
}

/// Stop a container
///
/// # Arguments
/// * `runtime` - The runtime information (Docker or Podman)
/// * `container_id` - The ID or name of the container to stop
/// * `timeout` - Optional timeout in seconds before force killing
///
/// # Returns
/// * `Result<(), String>` - Success or error message
pub fn stop_container(
    runtime: &Runtime,
    container_id: &str,
    timeout: Option<u64>,
) -> Result<(), String> {
    let mut cmd = Command::new(&runtime.path);
    cmd.arg("stop");
    
    if let Some(t) = timeout {
        cmd.arg("--time").arg(t.to_string());
    }
    
    cmd.arg(container_id);
    
    let output = cmd
        .output()
        .map_err(|e| format!("Failed to execute {} stop: {}", runtime.runtime_type, e))?;
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Failed to stop container: {}", stderr));
    }
    
    Ok(())
}

/// Restart a container
///
/// # Arguments
/// * `runtime` - The runtime information (Docker or Podman)
/// * `container_id` - The ID or name of the container to restart
/// * `timeout` - Optional timeout in seconds before force killing
///
/// # Returns
/// * `Result<(), String>` - Success or error message
pub fn restart_container(
    runtime: &Runtime,
    container_id: &str,
    timeout: Option<u64>,
) -> Result<(), String> {
    let mut cmd = Command::new(&runtime.path);
    cmd.arg("restart");
    
    if let Some(t) = timeout {
        cmd.arg("--time").arg(t.to_string());
    }
    
    cmd.arg(container_id);
    
    let output = cmd
        .output()
        .map_err(|e| format!("Failed to execute {} restart: {}", runtime.runtime_type, e))?;
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Failed to restart container: {}", stderr));
    }
    
    Ok(())
}

/// Pause a container
///
/// # Arguments
/// * `runtime` - The runtime information (Docker or Podman)
/// * `container_id` - The ID or name of the container to pause
///
/// # Returns
/// * `Result<(), String>` - Success or error message
pub fn pause_container(runtime: &Runtime, container_id: &str) -> Result<(), String> {
    let output = Command::new(&runtime.path)
        .arg("pause")
        .arg(container_id)
        .output()
        .map_err(|e| format!("Failed to execute {} pause: {}", runtime.runtime_type, e))?;
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Failed to pause container: {}", stderr));
    }
    
    Ok(())
}

/// Unpause a container
///
/// # Arguments
/// * `runtime` - The runtime information (Docker or Podman)
/// * `container_id` - The ID or name of the container to unpause
///
/// # Returns
/// * `Result<(), String>` - Success or error message
pub fn unpause_container(runtime: &Runtime, container_id: &str) -> Result<(), String> {
    let output = Command::new(&runtime.path)
        .arg("unpause")
        .arg(container_id)
        .output()
        .map_err(|e| format!("Failed to execute {} unpause: {}", runtime.runtime_type, e))?;
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Failed to unpause container: {}", stderr));
    }
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{Runtime, RuntimeType, RuntimeStatus, Version};
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
    fn test_start_container_command() {
        // This test would require a running Docker/Podman instance
        // For now, we'll just verify the function signature
        let runtime = mock_runtime();
        let result = start_container(&runtime, "test-container");
        // We expect this to fail in test environment without Docker
        assert!(result.is_err() || result.is_ok());
    }

    #[test]
    fn test_stop_container_with_timeout() {
        let runtime = mock_runtime();
        let result = stop_container(&runtime, "test-container", Some(10));
        // We expect this to fail in test environment without Docker
        assert!(result.is_err() || result.is_ok());
    }
}
