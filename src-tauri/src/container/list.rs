/// Container listing functionality
use super::types::{Container, ContainerListOptions, ContainerState, PortBinding};
use crate::types::Runtime;
use std::collections::HashMap;
use std::process::Command;

/// List containers for the specified runtime
///
/// # Arguments
/// * `runtime` - The runtime information (Docker or Podman)
/// * `options` - Options for filtering and listing containers
///
/// # Returns
/// * `Result<Vec<Container>, String>` - List of containers or error message
///
/// # Example
/// ```
/// use harbor_master::container::list_containers;
/// use harbor_master::container::types::ContainerListOptions;
/// use harbor_master::types::Runtime;
/// 
/// // This example requires a running Docker/Podman instance
/// ```
pub fn list_containers(
    runtime: &Runtime,
    options: &ContainerListOptions,
) -> Result<Vec<Container>, String> {
    let mut cmd = Command::new(&runtime.path);
    
    cmd.arg("ps");
    
    if options.all {
        cmd.arg("--all");
    }
    
    if options.size {
        cmd.arg("--size");
    }
    
    cmd.arg("--format");
    cmd.arg("json");
    
    let output = cmd
        .output()
        .map_err(|e| format!("Failed to execute {} ps: {}", runtime.runtime_type, e))?;
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Failed to list containers: {}", stderr));
    }
    
    let stdout = String::from_utf8_lossy(&output.stdout);
    
    // Parse JSON output (each line is a separate JSON object)
    let mut containers = Vec::new();
    
    for line in stdout.lines() {
        if line.trim().is_empty() {
            continue;
        }
        
        match parse_container_json(line) {
            Ok(container) => containers.push(container),
            Err(e) => {
                eprintln!("Warning: Failed to parse container: {}", e);
                continue;
            }
        }
    }
    
    Ok(containers)
}

/// Parse container JSON output from Docker/Podman
fn parse_container_json(json: &str) -> Result<Container, String> {
    let value: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;
    
    let id = value["ID"]
        .as_str()
        .or_else(|| value["Id"].as_str())
        .unwrap_or("")
        .to_string();
    
    let names = value["Names"]
        .as_str()
        .unwrap_or("");
    let name = names
        .trim_start_matches('/')
        .split(',')
        .next()
        .unwrap_or("")
        .to_string();
    
    let image = value["Image"]
        .as_str()
        .unwrap_or("")
        .to_string();
    
    let image_id = value["ImageID"]
        .as_str()
        .unwrap_or("")
        .to_string();
    
    let command = value["Command"]
        .as_str()
        .unwrap_or("")
        .to_string();
    
    let created = value["Created"]
        .as_i64()
        .or_else(|| value["CreatedAt"].as_i64())
        .unwrap_or(0);
    
    let state_str = value["State"]
        .as_str()
        .unwrap_or("created");
    
    let state = match state_str.to_lowercase().as_str() {
        "created" => ContainerState::Created,
        "running" | "up" => ContainerState::Running,
        "paused" => ContainerState::Paused,
        "restarting" => ContainerState::Restarting,
        "removing" => ContainerState::Removing,
        "exited" | "stopped" => ContainerState::Exited,
        "dead" => ContainerState::Dead,
        _ => ContainerState::Created,
    };
    
    let status = value["Status"]
        .as_str()
        .unwrap_or("")
        .to_string();
    
    let ports = parse_ports(&value["Ports"]);
    
    let labels = parse_labels(&value["Labels"]);
    
    let size_rw = value["SizeRw"]
        .as_i64();
    
    let size_root_fs = value["SizeRootFs"]
        .as_i64();
    
    Ok(Container {
        id,
        name,
        image,
        image_id,
        command,
        created,
        state,
        status,
        ports,
        labels,
        size_rw,
        size_root_fs,
        networks: HashMap::new(),
        mounts: vec![],
    })
}

/// Parse port bindings from JSON
fn parse_ports(ports_value: &serde_json::Value) -> Vec<PortBinding> {
    let mut ports = Vec::new();
    
    if let Some(ports_str) = ports_value.as_str() {
        // Parse string format: "0.0.0.0:8080->80/tcp"
        for port_mapping in ports_str.split(',') {
            let port_mapping = port_mapping.trim();
            if port_mapping.is_empty() {
                continue;
            }
            
            if let Some(port) = parse_port_mapping(port_mapping) {
                ports.push(port);
            }
        }
    } else if let Some(ports_array) = ports_value.as_array() {
        // Parse array format
        for port_obj in ports_array {
            if let Some(port) = parse_port_object(port_obj) {
                ports.push(port);
            }
        }
    }
    
    ports
}

/// Parse a single port mapping string
fn parse_port_mapping(mapping: &str) -> Option<PortBinding> {
    // Format: "0.0.0.0:8080->80/tcp" or "80/tcp"
    let parts: Vec<&str> = mapping.split("->").collect();
    
    if parts.len() == 2 {
        // Has host mapping
        let host_part = parts[0];
        let container_part = parts[1];
        
        let host_parts: Vec<&str> = host_part.split(':').collect();
        let host_ip = if host_parts.len() == 2 {
            host_parts[0].to_string()
        } else {
            "0.0.0.0".to_string()
        };
        let host_port = host_parts.last()?.parse().ok()?;
        
        let container_parts: Vec<&str> = container_part.split('/').collect();
        let container_port = container_parts[0].parse().ok()?;
        let protocol = container_parts.get(1).unwrap_or(&"tcp").to_string();
        
        Some(PortBinding {
            container_port,
            host_port,
            protocol,
            host_ip,
        })
    } else {
        // No host mapping, just container port
        let container_parts: Vec<&str> = mapping.split('/').collect();
        let container_port = container_parts[0].parse().ok()?;
        let protocol = container_parts.get(1).unwrap_or(&"tcp").to_string();
        
        Some(PortBinding {
            container_port,
            host_port: 0,
            protocol,
            host_ip: "".to_string(),
        })
    }
}

/// Parse a port object from JSON
fn parse_port_object(port_obj: &serde_json::Value) -> Option<PortBinding> {
    let container_port = port_obj["PrivatePort"].as_u64()? as u16;
    let host_port = port_obj["PublicPort"].as_u64().unwrap_or(0) as u16;
    let protocol = port_obj["Type"].as_str().unwrap_or("tcp").to_string();
    let host_ip = port_obj["IP"].as_str().unwrap_or("0.0.0.0").to_string();
    
    Some(PortBinding {
        container_port,
        host_port,
        protocol,
        host_ip,
    })
}

/// Parse labels from JSON
fn parse_labels(labels_value: &serde_json::Value) -> HashMap<String, String> {
    let mut labels = HashMap::new();
    
    if let Some(labels_obj) = labels_value.as_object() {
        for (key, value) in labels_obj {
            if let Some(val_str) = value.as_str() {
                labels.insert(key.clone(), val_str.to_string());
            }
        }
    } else if let Some(labels_str) = labels_value.as_str() {
        // Parse comma-separated labels: "key1=value1,key2=value2"
        for label in labels_str.split(',') {
            let parts: Vec<&str> = label.split('=').collect();
            if parts.len() == 2 {
                labels.insert(parts[0].to_string(), parts[1].to_string());
            }
        }
    }
    
    labels
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_port_mapping_with_host() {
        let mapping = "0.0.0.0:8080->80/tcp";
        let port = parse_port_mapping(mapping).unwrap();
        
        assert_eq!(port.host_ip, "0.0.0.0");
        assert_eq!(port.host_port, 8080);
        assert_eq!(port.container_port, 80);
        assert_eq!(port.protocol, "tcp");
    }

    #[test]
    fn test_parse_port_mapping_without_host() {
        let mapping = "80/tcp";
        let port = parse_port_mapping(mapping).unwrap();
        
        assert_eq!(port.container_port, 80);
        assert_eq!(port.host_port, 0);
        assert_eq!(port.protocol, "tcp");
    }

    #[test]
    fn test_parse_container_state() {
        assert!(matches!(
            parse_state("running"),
            ContainerState::Running
        ));
        assert!(matches!(
            parse_state("exited"),
            ContainerState::Exited
        ));
        assert!(matches!(
            parse_state("paused"),
            ContainerState::Paused
        ));
    }
    
    fn parse_state(state: &str) -> ContainerState {
        match state.to_lowercase().as_str() {
            "running" | "up" => ContainerState::Running,
            "exited" | "stopped" => ContainerState::Exited,
            "paused" => ContainerState::Paused,
            _ => ContainerState::Created,
        }
    }
}
