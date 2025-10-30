use std::path::PathBuf;
use std::process::Command;
use std::time::Duration;
use tokio::time::timeout;

use crate::types::{Runtime, RuntimeStatus};

/// Timeout for status checks (3 seconds)
const STATUS_CHECK_TIMEOUT: Duration = Duration::from_secs(3);

/// Check if Docker daemon is running
async fn check_docker_status(path: &str) -> RuntimeStatus {
    let path_buf = PathBuf::from(path);
    
    let result = timeout(STATUS_CHECK_TIMEOUT, async {
        tokio::task::spawn_blocking(move || {
            Command::new(&path_buf)
                .arg("info")
                .output()
        })
        .await
    })
    .await;
    
    match result {
        Ok(Ok(Ok(output))) => {
            if output.status.success() {
                RuntimeStatus::Running
            } else {
                // Docker not running is normal - only treat permission issues as errors
                let stderr = String::from_utf8_lossy(&output.stderr);
                if stderr.contains("permission denied") {
                    RuntimeStatus::Error
                } else {
                    // Cannot connect to daemon or any other error = stopped
                    RuntimeStatus::Stopped
                }
            }
        }
        Ok(Ok(Err(_))) => RuntimeStatus::Stopped, // Failed to execute = stopped
        Ok(Err(_)) => RuntimeStatus::Stopped,      // Task join error = stopped
        Err(_) => RuntimeStatus::Unknown, // Timeout
    }
}

/// Check if Podman daemon/socket is accessible
async fn check_podman_status(path: &str) -> RuntimeStatus {
    let path_buf = PathBuf::from(path);
    
    let result = timeout(STATUS_CHECK_TIMEOUT, async {
        tokio::task::spawn_blocking(move || {
            Command::new(&path_buf)
                .arg("info")
                .output()
        })
        .await
    })
    .await;
    
    match result {
        Ok(Ok(Ok(output))) => {
            if output.status.success() {
                RuntimeStatus::Running
            } else {
                // Podman not running is normal - only treat permission issues as errors
                let stderr = String::from_utf8_lossy(&output.stderr);
                if stderr.contains("permission denied") {
                    RuntimeStatus::Error
                } else {
                    // Cannot connect to service or any other error = stopped
                    RuntimeStatus::Stopped
                }
            }
        }
        Ok(Ok(Err(_))) => RuntimeStatus::Stopped, // Failed to execute = stopped
        Ok(Err(_)) => RuntimeStatus::Stopped,      // Task join error = stopped
        Err(_) => RuntimeStatus::Unknown, // Timeout
    }
}

/// Check status of a runtime
pub async fn check_status(runtime: &Runtime) -> RuntimeStatus {
    match runtime.runtime_type {
        crate::types::RuntimeType::Docker => check_docker_status(&runtime.path).await,
        crate::types::RuntimeType::Podman => check_podman_status(&runtime.path).await,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{RuntimeType, Version};
    use chrono::Utc;

    fn create_test_runtime(runtime_type: RuntimeType, path: &str) -> Runtime {
        Runtime {
            id: "test".to_string(),
            runtime_type,
            path: path.to_string(),
            version: Version {
                major: 24,
                minor: 0,
                patch: 7,
                full: "24.0.7".to_string(),
            },
            status: RuntimeStatus::Unknown,
            last_checked: Utc::now(),
            detected_at: Utc::now(),
            mode: None,
            is_wsl: None,
            error: None,
            version_warning: None,
        }
    }

    #[tokio::test]
    async fn test_check_status_invalid_path() {
        let runtime = create_test_runtime(RuntimeType::Docker, "/nonexistent/docker");
        let status = check_status(&runtime).await;
        assert_eq!(status, RuntimeStatus::Error);
    }

    #[tokio::test]
    async fn test_check_status_timeout() {
        // Create a runtime with a path that will timeout
        let runtime = create_test_runtime(RuntimeType::Docker, "/bin/sleep");
        let start = std::time::Instant::now();
        let status = check_status(&runtime).await;
        let elapsed = start.elapsed();
        
        // Should timeout and return Unknown
        assert!(elapsed >= STATUS_CHECK_TIMEOUT);
        assert!(elapsed < STATUS_CHECK_TIMEOUT + Duration::from_millis(500));
        assert_eq!(status, RuntimeStatus::Unknown);
    }
}
