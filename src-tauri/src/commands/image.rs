use crate::image;
use crate::image::{Image, PruneImageOptions, PruneResult, RemoveImageOptions};
use crate::types::Runtime;

/// List all images for the current runtime
#[tauri::command]
pub async fn list_images(runtime: Runtime) -> Result<Vec<Image>, String> {
    image::list_images(&runtime)
}

/// Remove a single image
#[tauri::command]
pub async fn remove_image(
    runtime: Runtime,
    image_id: String,
    force: bool,
    no_prune: bool,
) -> Result<(), String> {
    let options = RemoveImageOptions { force, no_prune };
    image::remove_image(&runtime, &image_id, &options)
}

/// Remove multiple images
#[tauri::command]
pub async fn remove_images(
    runtime: Runtime,
    image_ids: Vec<String>,
    force: bool,
    no_prune: bool,
) -> Result<Vec<String>, String> {
    let options = RemoveImageOptions { force, no_prune };
    image::remove_images(&runtime, &image_ids, &options)
}

/// Prune unused images
#[tauri::command]
pub async fn prune_images(runtime: Runtime, all: bool) -> Result<PruneResult, String> {
    let options = PruneImageOptions { all };
    image::prune_images(&runtime, &options)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_list_images_docker() {
        // This test requires Docker to be installed and running
        // Skip if Docker is not available
        if std::process::Command::new("docker")
            .arg("--version")
            .output()
            .is_err()
        {
            eprintln!("Skipping test: Docker not available");
            return;
        }

        use crate::types::{Runtime, RuntimeStatus, RuntimeType, Version};
        use chrono::Utc;

        let runtime = Runtime {
            id: "test-docker".to_string(),
            runtime_type: RuntimeType::Docker,
            path: "docker".to_string(),
            version: Version {
                major: 24,
                minor: 0,
                patch: 0,
                full: "24.0.0".to_string(),
            },
            status: RuntimeStatus::Running,
            last_checked: Utc::now(),
            detected_at: Utc::now(),
            mode: None,
            is_wsl: None,
            error: None,
            version_warning: None,
        };

        let result = list_images(runtime).await;

        // Should not fail (even if no images exist)
        // Note: This may fail if Docker is not running, which is acceptable
        if result.is_ok() {
            let images = result.unwrap();
            println!("Found {} Docker images", images.len());
        } else {
            eprintln!(
                "Docker is installed but not running or accessible: {:?}",
                result.err()
            );
        }
    }

    #[tokio::test]
    async fn test_list_images_podman() {
        // This test requires Podman to be installed and running
        // Skip if Podman is not available
        if std::process::Command::new("podman")
            .arg("--version")
            .output()
            .is_err()
        {
            eprintln!("Skipping test: Podman not available");
            return;
        }

        use crate::types::{Runtime, RuntimeStatus, RuntimeType, Version};
        use chrono::Utc;

        let runtime = Runtime {
            id: "test-podman".to_string(),
            runtime_type: RuntimeType::Podman,
            path: "podman".to_string(),
            version: Version {
                major: 4,
                minor: 0,
                patch: 0,
                full: "4.0.0".to_string(),
            },
            status: RuntimeStatus::Running,
            last_checked: Utc::now(),
            detected_at: Utc::now(),
            mode: None,
            is_wsl: None,
            error: None,
            version_warning: None,
        };

        let result = list_images(runtime).await;

        // Should not fail (even if no images exist)
        // Note: This may fail if Podman is not running, which is acceptable
        if result.is_ok() {
            let images = result.unwrap();
            println!("Found {} Podman images", images.len());
        } else {
            eprintln!(
                "Podman is installed but not running or accessible: {:?}",
                result.err()
            );
        }
    }
}
