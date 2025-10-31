//! Docker runtime detection and version parsing
//!
//! This module handles the detection of Docker installations on the system,
//! including platform-specific search paths, WSL2 detection on Linux, and
//! version validation against minimum supported versions.

use std::path::PathBuf;
use std::process::Command;
use std::time::{Duration, Instant};
use std::error::Error;
use chrono::Utc;

use crate::types::{Runtime, RuntimeType, RuntimeStatus, DetectionResult, DetectionError};
use crate::runtime::version::{parse_version, validate_docker_version};

/// Returns platform-specific Docker installation paths
/// 
/// # Platform Paths
/// - **Windows**: Program Files Docker directories
/// - **macOS**: /usr/local/bin, Homebrew, Docker.app
/// - **Linux**: /usr/bin, /usr/local/bin, snap
fn get_platform_paths() -> Vec<PathBuf> {
    let mut paths = vec![];
    
    #[cfg(target_os = "windows")]
    {
        paths.push(PathBuf::from(r"C:\Program Files\Docker\Docker\resources\bin"));
        paths.push(PathBuf::from(r"C:\Program Files\Docker\Docker\resources\bin\docker.exe"));
    }
    
    #[cfg(target_os = "macos")]
    {
        paths.push(PathBuf::from("/usr/local/bin"));
        paths.push(PathBuf::from("/opt/homebrew/bin"));
        paths.push(PathBuf::from("/Applications/Docker.app/Contents/Resources/bin"));
    }
    
    #[cfg(target_os = "linux")]
    {
        paths.push(PathBuf::from("/usr/bin"));
        paths.push(PathBuf::from("/usr/local/bin"));
        paths.push(PathBuf::from("/snap/bin"));
    }
    
    paths
}

/// Locates the Docker executable in PATH or platform-specific directories
/// 
/// Searches for docker/docker.exe using:
/// 1. System PATH environment variable
/// 2. Platform-specific installation directories
/// 
/// # Returns
/// - `Some(PathBuf)` if Docker executable is found
/// - `None` if not found
fn find_docker_executable() -> Option<PathBuf> {
    // First try using 'which' crate to find in PATH
    if let Ok(path) = which::which("docker") {
        return Some(path);
    }
    
    // Try platform-specific paths
    for path in get_platform_paths() {
        if path.is_file() && path.file_name().unwrap_or_default() == "docker" || 
           path.file_name().unwrap_or_default() == "docker.exe" {
            return Some(path);
        }
        
        // Check if path is a directory, look for docker inside it
        if path.is_dir() {
            let docker_path = path.join("docker");
            if docker_path.is_file() {
                return Some(docker_path);
            }
            
            #[cfg(target_os = "windows")]
            {
                let docker_exe = path.join("docker.exe");
                if docker_exe.is_file() {
                    return Some(docker_exe);
                }
            }
        }
    }
    
    None
}

/// Detects Docker Desktop running in Windows when inside WSL2
/// 
/// On Linux systems, checks if running in WSL2 environment by examining
/// /proc/version for "microsoft" or "wsl" keywords. If found, attempts
/// to locate docker.exe in the Windows PATH.
/// 
/// # Returns
/// - `Some(PathBuf)` to docker.exe if in WSL2 and Docker Desktop is accessible
/// - `None` if not in WSL2 or Docker Desktop not found
#[cfg(target_os = "linux")]
fn detect_wsl_docker() -> Option<PathBuf> {
    // Check if we're in WSL
    if let Ok(contents) = std::fs::read_to_string("/proc/version") {
        if contents.to_lowercase().contains("microsoft") || contents.to_lowercase().contains("wsl") {
            // Try to find docker.exe in Windows PATH
            if let Ok(path) = which::which("docker.exe") {
                return Some(path);
            }
        }
    }
    None
}

/// Stub for WSL detection on non-Linux platforms
/// 
/// Always returns None since WSL only exists on Windows/Linux.
#[cfg(not(target_os = "linux"))]
fn detect_wsl_docker() -> Option<PathBuf> {
    None
}

/// Verifies that the executable has proper execute permissions
/// 
/// # Platform Behavior
/// - **Unix**: Checks execute bits (0o111) in file permissions
/// - **Windows**: Validates file exists and is not a directory
/// 
/// # Arguments
/// * `path` - Path to the executable to verify
/// 
/// # Returns
/// `true` if executable has proper permissions, `false` otherwise
fn verify_executable(path: &PathBuf) -> bool {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        if let Ok(metadata) = std::fs::metadata(path) {
            let permissions = metadata.permissions();
            return permissions.mode() & 0o111 != 0; // Check execute bits
        }
    }
    
    #[cfg(windows)]
    {
        // On Windows, just check if file exists and is not a directory
        return path.is_file();
    }
    
    false
}

/// Retrieves the Docker version string
/// 
/// Executes `docker --version` command and parses the output.
/// 
/// # Arguments
/// * `docker_path` - Path to the Docker executable
/// 
/// # Returns
/// - `Ok(String)` containing the version output
/// - `Err` if command fails or output cannot be parsed
fn get_docker_version(docker_path: &PathBuf) -> Result<String, Box<dyn Error>> {
    let output = Command::new(docker_path)
        .arg("--version")
        .output()?;
    
    if !output.status.success() {
        return Err("Docker version command failed".into());
    }
    
    let version_str = String::from_utf8(output.stdout)?;
    Ok(version_str.trim().to_string())
}

/// Checks if the Docker daemon is currently running
/// 
/// Executes `docker info` command to verify daemon connectivity.
/// 
/// # Arguments
/// * `docker_path` - Path to the Docker executable
/// 
/// # Returns
/// `true` if daemon is running and responsive, `false` otherwise
fn check_docker_running(docker_path: &PathBuf) -> bool {
    let output = Command::new(docker_path)
        .arg("info")
        .output();
    
    match output {
        Ok(out) => out.status.success(),
        Err(_) => false,
    }
}

/// Detects Docker installation on the system with timeout protection
/// 
/// Performs comprehensive Docker detection including:
/// - Executable discovery in PATH and platform-specific locations
/// - WSL2 detection on Linux systems
/// - Version parsing and validation against minimum requirements
/// - Daemon status checking
/// - Permission verification
/// 
/// # Arguments
/// * `timeout_ms` - Maximum time in milliseconds before detection aborts
/// 
/// # Returns
/// `DetectionResult` containing:
/// - Found runtimes with version, status, and path information
/// - Detection errors if any occurred
/// - Total detection duration in milliseconds
/// 
/// # Example
/// ```no_run
/// use harbor_master::runtime::docker::detect_docker;
/// 
/// #[tokio::main]
/// async fn main() {
///     let result = detect_docker(5000).await;
///     println!("Found {} Docker runtime(s)", result.runtimes.len());
/// }
/// ```
pub async fn detect_docker(timeout_ms: u64) -> DetectionResult {
    let start = Instant::now();
    let timeout = Duration::from_millis(timeout_ms);
    
    let mut runtimes = Vec::new();
    let mut errors = Vec::new();
    
    // Try to find Docker executable
    let docker_path = tokio::task::spawn_blocking(find_docker_executable)
        .await
        .unwrap_or(None);
    
    let docker_path = docker_path.or_else(|| {
        // Check if timeout exceeded
        if start.elapsed() > timeout {
            return None;
        }
        detect_wsl_docker()
    });
    
    if let Some(path) = docker_path {
        // Check if timeout exceeded
        if start.elapsed() > timeout {
            errors.push(DetectionError {
                runtime: RuntimeType::Docker,
                path: path.to_string_lossy().to_string(),
                error: "Detection timeout exceeded".to_string(),
            });
        } else if !verify_executable(&path) {
            errors.push(DetectionError {
                runtime: RuntimeType::Docker,
                path: path.to_string_lossy().to_string(),
                error: "Executable lacks proper permissions".to_string(),
            });
        } else {
            // Get version
            match get_docker_version(&path) {
                Ok(version_str) => {
                    match parse_version(&version_str) {
                        Ok(version) => {
                            let is_wsl = cfg!(target_os = "linux") && 
                                        path.to_string_lossy().contains(".exe");
                            
                            let status = if check_docker_running(&path) {
                                RuntimeStatus::Running
                            } else {
                                RuntimeStatus::Stopped
                            };
                            
                            let version_warning = if !validate_docker_version(&version) {
                                Some(true)
                            } else {
                                None
                            };
                            
                            runtimes.push(Runtime {
                                id: format!("docker-{}", path.to_string_lossy()),
                                runtime_type: RuntimeType::Docker,
                                path: path.to_string_lossy().to_string(),
                                version,
                                status,
                                last_checked: Utc::now(),
                                detected_at: Utc::now(),
                                mode: None,
                                is_wsl: if is_wsl { Some(true) } else { None },
                                error: None,
                                version_warning,
                            });
                        }
                        Err(e) => {
                            errors.push(DetectionError {
                                runtime: RuntimeType::Docker,
                                path: path.to_string_lossy().to_string(),
                                error: format!("Failed to parse version: {}", e),
                            });
                        }
                    }
                }
                Err(e) => {
                    errors.push(DetectionError {
                        runtime: RuntimeType::Docker,
                        path: path.to_string_lossy().to_string(),
                        error: format!("Failed to get version: {}", e),
                    });
                }
            }
        }
    }
    
    let duration = start.elapsed().as_millis() as u64;
    
    DetectionResult {
        runtimes,
        detected_at: Utc::now(),
        duration,
        errors,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::Version;

    #[test]
    fn test_get_platform_paths() {
        let paths = get_platform_paths();
        assert!(!paths.is_empty());
        
        // Verify paths contain expected directories based on platform
        #[cfg(target_os = "macos")]
        {
            let expected_paths = vec!["/usr/local/bin", "/opt/homebrew/bin"];
            for expected in expected_paths {
                assert!(paths.iter().any(|p| p.to_string_lossy() == expected));
            }
        }
        
        #[cfg(target_os = "windows")]
        {
            let program_files = std::env::var("ProgramFiles").unwrap_or_default();
            assert!(paths.iter().any(|p| p.contains(&program_files)));
        }
        
        #[cfg(target_os = "linux")]
        {
            assert!(paths.contains(&"/usr/bin".to_string()));
        }
    }

    #[test]
    fn test_parse_version_valid() {
        let version_str = "Docker version 24.0.7, build afdd53b";
        let result = parse_version(version_str);
        assert!(result.is_ok());
        
        let version = result.unwrap();
        assert_eq!(version.major, 24);
        assert_eq!(version.minor, 0);
        assert_eq!(version.patch, 7);
        assert_eq!(version.full, "24.0.7");
    }

    #[test]
    fn test_parse_version_simple() {
        let version_str = "25.1.0";
        let result = parse_version(version_str);
        assert!(result.is_ok());
        
        let version = result.unwrap();
        assert_eq!(version.major, 25);
        assert_eq!(version.minor, 1);
        assert_eq!(version.patch, 0);
    }

    #[test]
    fn test_parse_version_with_suffix() {
        let version_str = "Docker version 20.10.21-ce";
        let result = parse_version(version_str);
        assert!(result.is_ok());
        
        let version = result.unwrap();
        assert_eq!(version.major, 20);
        assert_eq!(version.minor, 10);
        assert_eq!(version.patch, 21);
    }

    #[test]
    fn test_parse_version_invalid() {
        let invalid_versions = vec![
            "not a version",
            "v",
            "1.2",  // Missing patch
            "abc.def.ghi",
        ];
        
        for version_str in invalid_versions {
            let result = parse_version(version_str);
            assert!(result.is_err(), "Should fail for: {}", version_str);
        }
    }

    #[test]
    fn test_validate_docker_version_minimum() {
        let valid = Version {
            major: 20,
            minor: 10,
            patch: 0,
            full: "20.10.0".to_string(),
        };
        assert!(validate_docker_version(&valid));
        
        // Exact minimum version 20.10.0
        let exact_min = Version {
            major: 20,
            minor: 10,
            patch: 0,
            full: "20.10.0".to_string(),
        };
        assert!(validate_docker_version(&exact_min));
    }

    #[test]
    fn test_validate_docker_version_below_minimum() {
        let too_old = Version {
            major: 19,
            minor: 2,
            patch: 9,
            full: "19.2.9".to_string(),
        };
        assert!(!validate_docker_version(&too_old));
        
        let very_old = Version {
            major: 18,
            minor: 0,
            patch: 0,
            full: "18.0.0".to_string(),
        };
        assert!(!validate_docker_version(&very_old));
    }

    #[test]
    fn test_verify_executable_permissions() {
        // Test with a known executable (the current binary)
        let current_exe = std::env::current_exe().unwrap();
        assert!(verify_executable(&current_exe));
        
        // Test with a non-existent path
        let fake_path = PathBuf::from("/nonexistent/path/to/binary");
        assert!(!verify_executable(&fake_path));
    }

    #[cfg(target_os = "linux")]
    #[test]
    fn test_detect_wsl_docker() {
        // This test checks if WSL detection logic works
        // It will return None on non-WSL systems
        let result = detect_wsl_docker();
        // Just verify it doesn't panic - actual result depends on environment
        let _ = result;
    }

    #[tokio::test]
    async fn test_detect_docker_timeout() {
        let result = detect_docker(500).await;
        // Should complete within reasonable time
        // Detection can take time but should finish
        assert!(result.duration <= 1000); // Allow 1 second max
    }

    #[tokio::test]
    async fn test_detect_docker_structure() {
        let result = detect_docker(500).await;
        
        // Verify result structure is valid
        assert!(result.duration > 0);
        
        // If Docker is installed, verify runtime data
        if !result.runtimes.is_empty() {
            let runtime = &result.runtimes[0];
            assert!(!runtime.id.is_empty());
            assert_eq!(runtime.runtime_type, RuntimeType::Docker);
            assert!(!runtime.path.is_empty());
            assert!(runtime.version.major > 0);
        }
    }
}
