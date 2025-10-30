use std::path::PathBuf;
use std::process::Command;
use std::time::{Duration, Instant};
use std::error::Error;
use chrono::Utc;

use crate::types::{Runtime, RuntimeType, RuntimeStatus, DetectionResult, DetectionError};
use crate::runtime::version::parse_version;

/// Platform-specific Docker installation paths
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

/// Find Docker executable in PATH or platform-specific locations
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

/// Check if running in WSL2 and detect Windows Docker
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

#[cfg(not(target_os = "linux"))]
fn detect_wsl_docker() -> Option<PathBuf> {
    None
}

/// Verify executable has proper permissions
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

/// Get Docker version
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

/// Check if Docker daemon is running
fn check_docker_running(docker_path: &PathBuf) -> bool {
    let output = Command::new(docker_path)
        .arg("info")
        .output();
    
    match output {
        Ok(out) => out.status.success(),
        Err(_) => false,
    }
}

/// Detect Docker installation with timeout
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

    #[test]
    fn test_get_platform_paths() {
        let paths = get_platform_paths();
        assert!(!paths.is_empty());
    }

    #[tokio::test]
    async fn test_detect_docker_timeout() {
        let result = detect_docker(500).await;
        // Should complete within reasonable time
        // Detection can take time but should finish
        assert!(result.duration <= 1000); // Allow 1 second max
    }
}
