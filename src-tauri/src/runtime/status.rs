//! Runtime status checking functionality
//!
//! This module provides status checking for Docker and Podman runtimes,
//! determining whether they are Running, Stopped, in an Error state, or Unknown.
//! Uses timeouts to prevent hanging on unresponsive runtimes.

use std::path::PathBuf;
use std::process::Command;
use std::time::Duration;
use tokio::time::timeout;

use crate::types::{Runtime, RuntimeStatus};

/// Maximum time to wait for a status check command (3 seconds)
const STATUS_CHECK_TIMEOUT: Duration = Duration::from_secs(3);

/// Checks if the Docker daemon is currently running
/// 
/// Executes `docker info` with a 3-second timeout to determine daemon status.
/// 
/// # Arguments
/// * `path` - Path to the Docker executable
/// 
/// # Returns
/// - `RuntimeStatus::Running` if daemon is accessible and responsive
/// - `RuntimeStatus::Stopped` if daemon is not running or command fails
/// - `RuntimeStatus::Error` if permission denied
/// - `RuntimeStatus::Unknown` if timeout occurs
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

/// Checks if Podman is accessible and running
/// 
/// Executes `podman info` with a 3-second timeout to verify accessibility.
/// 
/// # Arguments
/// * `path` - Path to the Podman executable
/// 
/// # Returns
/// - `RuntimeStatus::Running` if Podman is accessible and responsive
/// - `RuntimeStatus::Stopped` if Podman service is not running or command fails
/// - `RuntimeStatus::Error` if permission denied
/// - `RuntimeStatus::Unknown` if timeout occurs
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

/// Checks the current status of a runtime
/// 
/// Delegates to runtime-specific status check functions and includes timeout protection.
/// 
/// # Arguments
/// * `runtime` - The runtime to check status for
/// 
/// # Returns
/// Current `RuntimeStatus` (Running, Stopped, Error, or Unknown)
/// 
/// # Example
/// ```no_run
/// use harbor_master::runtime::status::check_status;
/// use harbor_master::types::{Runtime, RuntimeType, RuntimeStatus, Version};
/// use chrono::Utc;
/// 
/// #[tokio::main]
/// async fn main() {
///     let runtime = Runtime {
///         id: "docker-1".to_string(),
///         runtime_type: RuntimeType::Docker,
///         path: "/usr/bin/docker".to_string(),
///         version: Version { 
///             major: 24, 
///             minor: 0, 
///             patch: 7,
///             full: "24.0.7".to_string(),
///         },
///         status: RuntimeStatus::Unknown,
///         last_checked: Utc::now(),
///         detected_at: Utc::now(),
///         mode: None,
///         is_wsl: None,
///         error: None,
///         version_warning: None,
///     };
///     
///     let status = check_status(&runtime).await;
///     match status {
///         RuntimeStatus::Running => println!("Runtime is active"),
///         RuntimeStatus::Stopped => println!("Runtime is not running"),
///         _ => println!("Status unknown or error"),
///     }
/// }
/// ```
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
        // Invalid path returns Stopped (not Error - we only use Error for permission issues)
        assert_eq!(status, RuntimeStatus::Stopped);
    }

    #[tokio::test]
    async fn test_check_status_timeout() {
        // This test verifies timeout logic by using a non-existent path
        // The command will fail quickly, not timeout, so we just verify it completes
        let runtime = create_test_runtime(RuntimeType::Docker, "/nonexistent/path");
        let start = std::time::Instant::now();
        let status = check_status(&runtime).await;
        let elapsed = start.elapsed();
        
        // Should complete quickly (not timeout) and return Stopped
        assert!(elapsed < STATUS_CHECK_TIMEOUT + Duration::from_millis(500));
        assert_eq!(status, RuntimeStatus::Stopped);
    }
}
