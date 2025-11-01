/// Container management module
///
/// This module provides functionality for managing Docker and Podman containers,
/// including listing, lifecycle operations, inspection, and removal.
pub mod inspect;
pub mod lifecycle;
pub mod list;
pub mod remove;
pub mod types;

// Re-export commonly used types
pub use inspect::{inspect_container, ContainerDetails};
pub use lifecycle::{pause_container, restart_container, start_container, stop_container, unpause_container};
pub use list::list_containers;
pub use remove::{prune_containers, remove_container, remove_containers, PruneResult, RemoveOptions};
pub use types::{Container, ContainerListOptions};
