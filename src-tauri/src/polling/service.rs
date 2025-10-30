use std::sync::Arc;
use std::time::Duration;
use tokio::sync::{Mutex, RwLock};
use tokio::time::interval;
use tauri::{AppHandle, Emitter};
use chrono::Utc;

use crate::types::{Runtime, RuntimeStatus, StatusUpdate};
use crate::runtime::status::check_status;

/// Polling service state
pub struct PollingService {
    /// Currently monitored runtimes
    runtimes: Arc<RwLock<Vec<Runtime>>>,
    /// Is polling active
    is_running: Arc<Mutex<bool>>,
    /// Poll interval in seconds
    interval_secs: u64,
    /// Failure counts for exponential backoff
    failure_counts: Arc<RwLock<std::collections::HashMap<String, u32>>>,
}

impl PollingService {
    pub fn new(interval_secs: u64) -> Self {
        Self {
            runtimes: Arc::new(RwLock::new(Vec::new())),
            is_running: Arc::new(Mutex::new(false)),
            interval_secs,
            failure_counts: Arc::new(RwLock::new(std::collections::HashMap::new())),
        }
    }

    /// Update the list of runtimes to monitor
    pub async fn set_runtimes(&self, runtimes: Vec<Runtime>) {
        let mut lock = self.runtimes.write().await;
        *lock = runtimes;
    }

    /// Start polling for status updates
    pub async fn start(&self, app: AppHandle) -> Result<(), String> {
        let mut is_running = self.is_running.lock().await;
        if *is_running {
            return Err("Polling service already running".to_string());
        }
        *is_running = true;
        drop(is_running);

        let runtimes = Arc::clone(&self.runtimes);
        let is_running_clone = Arc::clone(&self.is_running);
        let failure_counts = Arc::clone(&self.failure_counts);
        let interval_duration = Duration::from_secs(self.interval_secs);

        tokio::spawn(async move {
            let mut tick = interval(interval_duration);

            loop {
                tick.tick().await;

                // Check if we should stop
                let should_stop = {
                    let running = is_running_clone.lock().await;
                    !*running
                };
                
                if should_stop {
                    break;
                }

                // Get current runtimes
                let current_runtimes = {
                    let lock = runtimes.read().await;
                    lock.clone()
                };

                // Check status for each runtime
                for runtime in current_runtimes {
                    let runtime_id = runtime.id.clone();
                    
                    // Check if we should apply backoff
                    let should_skip = {
                        let failures = failure_counts.read().await;
                        if let Some(&count) = failures.get(&runtime_id) {
                            if count > 0 {
                                // Exponential backoff: skip check for 2^count intervals
                                let backoff_intervals = 2u32.pow(count.min(5));
                                // For simplicity, we'll just skip on certain intervals
                                // A more sophisticated implementation would track per-runtime timers
                                use rand::Rng;
                                rand::thread_rng().gen::<u32>() % backoff_intervals != 0
                            } else {
                                false
                            }
                        } else {
                            false
                        }
                    };

                    if should_skip {
                        continue;
                    }

                    let new_status = check_status(&runtime).await;
                    
                    // Update failure count
                    let mut failures = failure_counts.write().await;
                    if new_status == RuntimeStatus::Error || new_status == RuntimeStatus::Unknown {
                        let count = failures.entry(runtime_id.clone()).or_insert(0);
                        *count = (*count + 1).min(5); // Cap at 5 for max backoff of 2^5 = 32 intervals
                    } else {
                        failures.remove(&runtime_id);
                    }
                    drop(failures);

                    // Emit status update event
                    let update = StatusUpdate {
                        runtime_id: runtime_id.clone(),
                        status: new_status,
                        timestamp: Utc::now(),
                        error: None,
                    };

                    if let Err(e) = app.emit("runtime-status-update", &update) {
                        eprintln!("Failed to emit status update: {}", e);
                    }
                }
            }
        });

        Ok(())
    }

    /// Stop polling
    pub async fn stop(&self) {
        let mut is_running = self.is_running.lock().await;
        *is_running = false;
    }

    /// Check if polling is active
    #[allow(dead_code)]
    pub async fn is_running(&self) -> bool {
        let is_running = self.is_running.lock().await;
        *is_running
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{RuntimeType, Version};

    fn create_test_runtime(id: &str) -> Runtime {
        Runtime {
            id: id.to_string(),
            runtime_type: RuntimeType::Docker,
            path: "/usr/bin/docker".to_string(),
            version: Version {
                major: 24,
                minor: 0,
                patch: 7,
                full: "24.0.7".to_string(),
            },
            status: RuntimeStatus::Unknown,
            last_checked: Utc::now(),
            detected_at: Utc::now(),
            mode: None,
            is_wsl: None,
            error: None,
            version_warning: None,
        }
    }

    #[tokio::test]
    async fn test_service_creation() {
        let service = PollingService::new(5);
        assert!(!service.is_running().await);
    }

    #[tokio::test]
    async fn test_set_runtimes() {
        let service = PollingService::new(5);
        let runtimes = vec![create_test_runtime("test1"), create_test_runtime("test2")];
        
        service.set_runtimes(runtimes.clone()).await;
        
        let stored = service.runtimes.read().await;
        assert_eq!(stored.len(), 2);
        assert_eq!(stored[0].id, "test1");
        assert_eq!(stored[1].id, "test2");
    }
}
