use std::path::PathBuf;
use std::process::Command;
use std::time::{Duration, Instant};
use std::error::Error;
use chrono::Utc;

use crate::types::{Runtime, RuntimeType, RuntimeStatus, PodmanMode, DetectionResult, DetectionError};
use crate::runtime::version::{parse_version, validate_podman_version};

/// Platform-specific Podman installation paths
fn get_platform_paths() -> Vec<PathBuf> {
    let mut paths = vec![];
    
    #[cfg(target_os = "windows")]
    {
        paths.push(PathBuf::from(r"C:\Program Files\RedHat\Podman"));
        paths.push(PathBuf::from(r"C:\Program Files\RedHat\Podman\podman.exe"));
    }
    
    #[cfg(target_os = "macos")]
    {
        paths.push(PathBuf::from("/usr/local/bin"));
        paths.push(PathBuf::from("/opt/homebrew/bin"));
        paths.push(PathBuf::from("/opt/podman/bin"));
    }
    
    #[cfg(target_os = "linux")]
    {
        paths.push(PathBuf::from("/usr/bin"));
        paths.push(PathBuf::from("/usr/local/bin"));
        paths.push(PathBuf::from("/usr/libexec/podman"));
    }
    
    paths
}

/// Find Podman executable in PATH or platform-specific locations
fn find_podman_executable() -> Option<PathBuf> {
    // First try using 'which' crate to find in PATH
    if let Ok(path) = which::which("podman") {
        return Some(path);
    }
    
    // Try platform-specific paths
    for path in get_platform_paths() {
        if path.is_file() && path.file_name().unwrap_or_default() == "podman" || 
           path.file_name().unwrap_or_default() == "podman.exe" {
            return Some(path);
        }
        
        // Check if path is a directory, look for podman inside it
        if path.is_dir() {
            let podman_path = path.join("podman");
            if podman_path.is_file() {
                return Some(podman_path);
            }
            
            #[cfg(target_os = "windows")]
            {
                let podman_exe = path.join("podman.exe");
                if podman_exe.is_file() {
                    return Some(podman_exe);
                }
            }
        }
    }
    
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

/// Detect if Podman is running in rootless mode
fn detect_rootless_mode(podman_path: &PathBuf) -> Option<PodmanMode> {
    let output = Command::new(podman_path)
        .args(&["info", "--format={{.Host.Security.Rootless}}"])
        .output();
    
    match output {
        Ok(out) if out.status.success() => {
            let output_str = String::from_utf8_lossy(&out.stdout).trim().to_lowercase();
            if output_str == "true" {
                Some(PodmanMode::Rootless)
            } else if output_str == "false" {
                Some(PodmanMode::Rootful)
            } else {
                // If we can't determine, default to rootless (safer assumption for modern Podman)
                Some(PodmanMode::Rootless)
            }
        }
        _ => {
            // If command fails, try to infer from version or default to rootless
            Some(PodmanMode::Rootless)
        }
    }
}

/// Get Podman version
fn get_podman_version(podman_path: &PathBuf) -> Result<String, Box<dyn Error>> {
    let output = Command::new(podman_path)
        .arg("--version")
        .output()?;
    
    if !output.status.success() {
        return Err("Podman version command failed".into());
    }
    
    let version_str = String::from_utf8(output.stdout)?;
    Ok(version_str.trim().to_string())
}

/// Check if Podman is accessible (can run info command)
fn check_podman_running(podman_path: &PathBuf) -> bool {
    let output = Command::new(podman_path)
        .arg("info")
        .output();
    
    match output {
        Ok(out) => out.status.success(),
        Err(_) => false,
    }
}

/// Detect Podman installation with timeout
pub async fn detect_podman(timeout_ms: u64) -> DetectionResult {
    let start = Instant::now();
    let timeout = Duration::from_millis(timeout_ms);
    
    let mut runtimes = Vec::new();
    let mut errors = Vec::new();
    
    // Try to find Podman executable
    let podman_path = tokio::task::spawn_blocking(find_podman_executable)
        .await
        .unwrap_or(None);
    
    if let Some(path) = podman_path {
        // Check if timeout exceeded
        if start.elapsed() > timeout {
            errors.push(DetectionError {
                runtime: RuntimeType::Podman,
                path: path.to_string_lossy().to_string(),
                error: "Detection timeout exceeded".to_string(),
            });
        } else if !verify_executable(&path) {
            errors.push(DetectionError {
                runtime: RuntimeType::Podman,
                path: path.to_string_lossy().to_string(),
                error: "Executable lacks proper permissions".to_string(),
            });
        } else {
            // Get version
            match get_podman_version(&path) {
                Ok(version_str) => {
                    match parse_version(&version_str) {
                        Ok(version) => {
                            let mode = detect_rootless_mode(&path);
                            let status = if check_podman_running(&path) {
                                RuntimeStatus::Running
                            } else {
                                RuntimeStatus::Stopped
                            };
                            
                            let version_warning = if !validate_podman_version(&version) {
                                Some(true)
                            } else {
                                None
                            };
                            
                            runtimes.push(Runtime {
                                id: format!("podman-{}", path.to_string_lossy()),
                                runtime_type: RuntimeType::Podman,
                                path: path.to_string_lossy().to_string(),
                                version,
                                status,
                                last_checked: Utc::now(),
                                detected_at: Utc::now(),
                                mode,
                                is_wsl: None,
                                error: None,
                                version_warning,
                            });
                        }
                        Err(e) => {
                            errors.push(DetectionError {
                                runtime: RuntimeType::Podman,
                                path: path.to_string_lossy().to_string(),
                                error: format!("Failed to parse version: {}", e),
                            });
                        }
                    }
                }
                Err(e) => {
                    errors.push(DetectionError {
                        runtime: RuntimeType::Podman,
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
        
        // Verify paths contain expected directories
        #[cfg(target_os = "macos")]
        {
            let expected_paths = vec!["/usr/local/bin", "/opt/homebrew/bin"];
            for expected in expected_paths {
                assert!(paths.iter().any(|p| p.to_string_lossy() == expected));
            }
        }
        
        #[cfg(target_os = "linux")]
        {
            assert!(paths.iter().any(|p| p.to_string_lossy() == "/usr/bin"));
        }
    }

    #[test]
    fn test_parse_version_valid() {
        let version_str = "podman version 4.5.1";
        let result = parse_version(version_str);
        assert!(result.is_ok());
        
        let version = result.unwrap();
        assert_eq!(version.major, 4);
        assert_eq!(version.minor, 5);
        assert_eq!(version.patch, 1);
        assert_eq!(version.full, "4.5.1");
    }

    #[test]
    fn test_parse_version_simple() {
        let version_str = "5.0.2";
        let result = parse_version(version_str);
        assert!(result.is_ok());
        
        let version = result.unwrap();
        assert_eq!(version.major, 5);
        assert_eq!(version.minor, 0);
        assert_eq!(version.patch, 2);
    }

    #[test]
    fn test_parse_version_with_build() {
        let version_str = "podman version 4.3.1-dev";
        let result = parse_version(version_str);
        assert!(result.is_ok());
        
        let version = result.unwrap();
        assert_eq!(version.major, 4);
        assert_eq!(version.minor, 3);
        assert_eq!(version.patch, 1);
    }

    #[test]
    fn test_parse_version_invalid() {
        let invalid_versions = vec![
            "not a version",
            "podman",
            "1.2",  // Missing patch
            "x.y.z",
        ];
        
        for version_str in invalid_versions {
            let result = parse_version(version_str);
            assert!(result.is_err(), "Should fail for: {}", version_str);
        }
    }

    #[test]
    fn test_validate_podman_version_minimum() {
        let valid = Version {
            major: 4,
            minor: 0,
            patch: 0,
            full: "4.0.0".to_string(),
        };
        assert!(validate_podman_version(&valid));
        
        let exact_min = Version {
            major: 3,
            minor: 0,
            patch: 0,
            full: "3.0.0".to_string(),
        };
        assert!(validate_podman_version(&exact_min));
    }

    #[test]
    fn test_validate_podman_version_below_minimum() {
        let too_old = Version {
            major: 2,
            minor: 9,
            patch: 9,
            full: "2.9.9".to_string(),
        };
        assert!(!validate_podman_version(&too_old));
        
        let very_old = Version {
            major: 1,
            minor: 0,
            patch: 0,
            full: "1.0.0".to_string(),
        };
        assert!(!validate_podman_version(&very_old));
    }

    #[test]
    fn test_detect_rootless_mode() {
        // This test verifies the function doesn't panic
        // Actual result depends on environment and Podman installation
        let fake_path = PathBuf::from("/usr/bin/podman");
        let mode = detect_rootless_mode(&fake_path);
        
        // Mode should be either rootful or rootless, or None
        if let Some(m) = mode {
            assert!(m == PodmanMode::Rootful || m == PodmanMode::Rootless);
        }
    }

    #[tokio::test]
    async fn test_detect_podman_timeout() {
        let result = detect_podman(500).await;
        // Should complete within reasonable time
        assert!(result.duration <= 2000); // Allow 2 seconds max
    }

    #[tokio::test]
    async fn test_detect_podman_structure() {
        let result = detect_podman(500).await;
        
        // Verify result structure is valid
        assert!(result.duration > 0);
        
        // If Podman is installed, verify runtime data
        if !result.runtimes.is_empty() {
            let runtime = &result.runtimes[0];
            assert!(!runtime.id.is_empty());
            assert_eq!(runtime.runtime_type, RuntimeType::Podman);
            assert!(!runtime.path.is_empty());
            assert!(runtime.version.major > 0);
            
            // Podman should have mode information
            assert!(runtime.mode.is_some());
        }
    }
}
