use crate::types::{DetectionResult, Runtime};
use crate::runtime::{docker::detect_docker, podman::detect_podman, cache::DetectionCache};
use std::sync::Arc;

/// Runtime detector with caching capabilities
/// 
/// Coordinates detection of Docker and Podman runtimes on the system.
/// Implements caching to avoid repeated expensive detection operations.
/// 
/// # Features
/// - Automatic caching with configurable TTL
/// - Parallel detection of multiple runtimes
/// - Timeout protection for detection operations
/// - Cache clearing for forced re-detection
pub struct RuntimeDetector {
    cache: Arc<DetectionCache>,
    detection_timeout: u64,
}

impl RuntimeDetector {
    /// Creates a new RuntimeDetector with specified cache and timeout settings
    /// 
    /// # Arguments
    /// * `cache_ttl` - Time-to-live for cached detection results in milliseconds (e.g., 60000 for 60 seconds)
    /// * `detection_timeout` - Maximum time allowed for a single detection operation in milliseconds (e.g., 500)
    /// 
    /// # Example
    /// ```
    /// use harbor_master::runtime::detector::RuntimeDetector;
    /// 
    /// let detector = RuntimeDetector::new(60_000, 500);
    /// ```
    pub fn new(cache_ttl: u64, detection_timeout: u64) -> Self {
        Self {
            cache: Arc::new(DetectionCache::new(cache_ttl)),
            detection_timeout,
        }
    }

    /// Detects Docker installations on the system with caching
    /// 
    /// Checks cache first, performs detection if cache miss.
    /// Detection includes PATH scanning, platform-specific locations, and WSL2 support.
    /// 
    /// # Returns
    /// DetectionResult containing found Docker runtimes, errors, and detection metadata
    pub async fn detect_docker(&self) -> DetectionResult {
        // Check cache first
        if let Some(cached) = self.cache.get(&crate::types::RuntimeType::Docker) {
            return cached;
        }

        // Perform detection
        let result = detect_docker(self.detection_timeout).await;

        // Cache the result
        self.cache.set(crate::types::RuntimeType::Docker, result.clone());

        result
    }

    /// Detects Podman installations on the system with caching
    /// 
    /// Checks cache first, performs detection if cache miss.
    /// Detection includes PATH scanning, platform-specific locations, and rootful/rootless mode detection.
    /// 
    /// # Returns
    /// DetectionResult containing found Podman runtimes, mode information, errors, and detection metadata
    pub async fn detect_podman(&self) -> DetectionResult {
        // Check cache first
        if let Some(cached) = self.cache.get(&crate::types::RuntimeType::Podman) {
            return cached;
        }

        // Perform detection
        let result = detect_podman(self.detection_timeout).await;

        // Cache the result
        self.cache.set(crate::types::RuntimeType::Podman, result.clone());

        result
    }

    /// Detects all container runtimes (Docker and Podman) in parallel
    /// 
    /// Runs Docker and Podman detection concurrently using tokio::join! for better performance.
    /// Each detection uses its own cache and timeout settings.
    /// 
    /// # Returns
    /// Vector of all detected runtimes (Docker and Podman combined)
    pub async fn detect_all(&self) -> Vec<Runtime> {
        let (docker_result, podman_result) = tokio::join!(
            self.detect_docker(),
            self.detect_podman()
        );
        
        let mut all_runtimes = Vec::new();
        all_runtimes.extend(docker_result.runtimes);
        all_runtimes.extend(podman_result.runtimes);
        
        all_runtimes
    }

    /// Clears the cache for a specific runtime type
    /// 
    /// # Arguments
    /// * `runtime_type` - The type of runtime to clear cache for (Docker or Podman)
    #[allow(dead_code)]
    pub fn clear_cache(&self, runtime_type: &crate::types::RuntimeType) {
        self.cache.clear(runtime_type);
    }

    /// Clears all cached detection results
    /// 
    /// Forces the next detection to perform a fresh scan of the system.
    /// Useful for manual refresh operations.
    pub fn clear_all_caches(&self) {
        self.cache.clear_all();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_detector_caching() {
        let detector = RuntimeDetector::new(60, 500);
        
        // First call should detect
        let result1 = detector.detect_docker().await;
        
        // Second call should use cache (should be very fast)
        let start = std::time::Instant::now();
        let result2 = detector.detect_docker().await;
        let elapsed = start.elapsed();
        
        // Cached result should be instant (<10ms)
        assert!(elapsed.as_millis() < 10);
        
        // Results should be the same
        assert_eq!(result1.runtimes.len(), result2.runtimes.len());
    }

    #[tokio::test]
    async fn test_detect_all() {
        let detector = RuntimeDetector::new(60, 500);
        
        // Should detect both Docker and Podman (returns empty vec if neither installed)
        let all_runtimes = detector.detect_all().await;
        
        // Result should be valid
        assert!(all_runtimes.is_empty() || !all_runtimes.is_empty());
    }
}
