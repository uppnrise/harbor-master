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
