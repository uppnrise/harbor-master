use crate::types::Runtime;
use std::process::Command;

/// Options for removing an image
#[derive(Debug, Clone, Default)]
pub struct RemoveImageOptions {
    /// Force removal even if containers are using this image
    pub force: bool,
    /// Remove image without deleting untagged parent images
    pub no_prune: bool,
}

/// Remove a single image
pub fn remove_image(
    runtime: &Runtime,
    image_id: &str,
    options: &RemoveImageOptions,
) -> Result<(), String> {
    // If force is enabled, first stop and remove any containers using this image
    if options.force {
        stop_and_remove_containers_using_image(runtime, image_id)?;
    }

    let mut cmd = Command::new(&runtime.path);
    cmd.arg("rmi");

    if options.force {
        cmd.arg("--force");
    }

    if options.no_prune {
        cmd.arg("--no-prune");
    }

    cmd.arg(image_id);

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to execute {} rmi: {}", runtime.runtime_type, e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Failed to remove image: {}", stderr));
    }

    Ok(())
}

/// Stop and remove containers using a specific image
fn stop_and_remove_containers_using_image(runtime: &Runtime, image_id: &str) -> Result<(), String> {
    // Get list of containers using this image (both running and stopped)
    let mut cmd = Command::new(&runtime.path);
    cmd.args([
        "ps",
        "-a",
        "--filter",
        &format!("ancestor={}", image_id),
        "--format",
        "{{.ID}}",
    ]);

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to list containers: {}", e))?;

    if !output.status.success() {
        // Non-critical error - continue anyway
        return Ok(());
    }

    let container_ids = String::from_utf8_lossy(&output.stdout);
    let ids: Vec<&str> = container_ids
        .lines()
        .filter(|line| !line.is_empty())
        .collect();

    // Stop and remove each container using synchronous Docker commands
    for container_id in ids {
        // First try to stop the container (in case it's running)
        let mut stop_cmd = Command::new(&runtime.path);
        stop_cmd.args(["stop", container_id]);
        let _ = stop_cmd.output(); // Ignore errors if already stopped

        // Then force remove the container
        let mut rm_cmd = Command::new(&runtime.path);
        rm_cmd.args(["rm", "-f", container_id]);
        let rm_output = rm_cmd
            .output()
            .map_err(|e| format!("Failed to remove container {}: {}", container_id, e))?;

        if !rm_output.status.success() {
            let stderr = String::from_utf8_lossy(&rm_output.stderr);
            return Err(format!(
                "Failed to remove container {}: {}",
                container_id, stderr
            ));
        }
    }

    Ok(())
}

/// Remove multiple images
pub fn remove_images(
    runtime: &Runtime,
    image_ids: &[String],
    options: &RemoveImageOptions,
) -> Result<Vec<String>, String> {
    let mut removed = Vec::new();
    let mut errors = Vec::new();

    for image_id in image_ids {
        match remove_image(runtime, image_id, options) {
            Ok(_) => removed.push(image_id.clone()),
            Err(e) => errors.push(format!("{}: {}", image_id, e)),
        }
    }

    if !errors.is_empty() {
        return Err(format!(
            "Failed to remove some images:\n{}",
            errors.join("\n")
        ));
    }

    Ok(removed)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_remove_options_default() {
        let options = RemoveImageOptions::default();
        assert!(!options.force);
        assert!(!options.no_prune);
    }

    #[test]
    fn test_remove_options_with_force() {
        let options = RemoveImageOptions {
            force: true,
            no_prune: false,
        };
        assert!(options.force);
        assert!(!options.no_prune);
    }
}
