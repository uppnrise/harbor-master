use regex::Regex;
use crate::types::Version;
use std::error::Error;

/// Parse version string from Docker or Podman output
/// Handles formats like:
/// - "Docker version 24.0.7, build afdd53b"
/// - "podman version 4.8.0"
/// - "24.0.7"
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

/// Validate that a Docker version meets minimum requirements (>= 20.10.0)
pub fn validate_docker_version(version: &Version) -> bool {
    version.major > 20 || (version.major == 20 && version.minor >= 10)
}

/// Validate that a Podman version meets minimum requirements (>= 3.0.0)
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
