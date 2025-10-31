//! Version parsing and validation utilities
//!
//! This module provides functions to parse semantic version strings from
//! Docker and Podman output, and validate versions against minimum requirements.

use regex::Regex;
use crate::types::Version;
use std::error::Error;

/// Parses semantic version from Docker or Podman output
/// 
/// Handles multiple output formats:
/// - `"Docker version 24.0.7, build afdd53b"` → 24.0.7
/// - `"podman version 4.8.0"` → 4.8.0
/// - `"24.0.7"` → 24.0.7
/// 
/// # Arguments
/// * `version_str` - Raw version string from --version command
/// 
/// # Returns
/// - `Ok(Version)` with parsed major, minor, patch numbers
/// - `Err` if string doesn't contain valid semantic version
/// 
/// # Example
/// ```
/// use harbor_master::runtime::version::parse_version;
/// 
/// let version = parse_version("Docker version 24.0.7, build afdd53b").unwrap();
/// assert_eq!(version.major, 24);
/// assert_eq!(version.minor, 0);
/// assert_eq!(version.patch, 7);
/// ```
pub fn parse_version(version_str: &str) -> Result<Version, Box<dyn Error>> {
    // Regex to match semantic version (major.minor.patch)
    let re = Regex::new(r"(\d+)\.(\d+)\.(\d+)")?;
    
    if let Some(caps) = re.captures(version_str) {
        let major: u32 = caps.get(1)
            .ok_or("Missing major version")?
            .as_str()
            .parse()?;
        let minor: u32 = caps.get(2)
            .ok_or("Missing minor version")?
            .as_str()
            .parse()?;
        let patch: u32 = caps.get(3)
            .ok_or("Missing patch version")?
            .as_str()
            .parse()?;
        
        Ok(Version {
            major,
            minor,
            patch,
            full: format!("{}.{}.{}", major, minor, patch),
        })
    } else {
        Err(format!("Could not parse version from: {}", version_str).into())
    }
}

/// Validates Docker version against minimum requirements
/// 
/// Ensures Docker version is >= 20.10.0, which is the minimum supported version
/// for modern container features and security updates.
/// 
/// # Arguments
/// * `version` - Parsed version to validate
/// 
/// # Returns
/// `true` if version meets minimum requirements, `false` otherwise
pub fn validate_docker_version(version: &Version) -> bool {
    version.major > 20 || (version.major == 20 && version.minor >= 10)
}

/// Validates Podman version against minimum requirements
/// 
/// Ensures Podman version is >= 3.0.0, which provides stable API compatibility
/// and essential container management features.
/// 
/// # Arguments
/// * `version` - Parsed version to validate
/// 
/// # Returns
/// `true` if version meets minimum requirements, `false` otherwise
pub fn validate_podman_version(version: &Version) -> bool {
    version.major >= 3
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_docker_version() {
        let result = parse_version("Docker version 24.0.7, build afdd53b").unwrap();
        assert_eq!(result.major, 24);
        assert_eq!(result.minor, 0);
        assert_eq!(result.patch, 7);
        assert_eq!(result.full, "24.0.7");
    }

    #[test]
    fn test_parse_podman_version() {
        let result = parse_version("podman version 4.8.0").unwrap();
        assert_eq!(result.major, 4);
        assert_eq!(result.minor, 8);
        assert_eq!(result.patch, 0);
        assert_eq!(result.full, "4.8.0");
    }

    #[test]
    fn test_parse_simple_version() {
        let result = parse_version("24.0.7").unwrap();
        assert_eq!(result.major, 24);
        assert_eq!(result.minor, 0);
        assert_eq!(result.patch, 7);
    }

    #[test]
    fn test_validate_docker_version() {
        assert!(validate_docker_version(&Version {
            major: 24,
            minor: 0,
            patch: 7,
            full: "24.0.7".to_string(),
        }));
        
        assert!(validate_docker_version(&Version {
            major: 20,
            minor: 10,
            patch: 0,
            full: "20.10.0".to_string(),
        }));
        
        assert!(!validate_docker_version(&Version {
            major: 20,
            minor: 9,
            patch: 0,
            full: "20.9.0".to_string(),
        }));
    }

    #[test]
    fn test_validate_podman_version() {
        assert!(validate_podman_version(&Version {
            major: 4,
            minor: 8,
            patch: 0,
            full: "4.8.0".to_string(),
        }));
        
        assert!(validate_podman_version(&Version {
            major: 3,
            minor: 0,
            patch: 0,
            full: "3.0.0".to_string(),
        }));
        
        assert!(!validate_podman_version(&Version {
            major: 2,
            minor: 9,
            patch: 0,
            full: "2.9.0".to_string(),
        }));
    }
}
