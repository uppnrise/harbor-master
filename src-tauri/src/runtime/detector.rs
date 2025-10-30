use crate::types::{DetectionResult, Runtime};
use crate::runtime::{docker::detect_docker, cache::DetectionCache};
use std::sync::Arc;

pub struct RuntimeDetector {
    cache: Arc<DetectionCache>,
    detection_timeout: u64,
}

impl RuntimeDetector {
    pub fn new(cache_ttl: u64, detection_timeout: u64) -> Self {
        Self {
            cache: Arc::new(DetectionCache::new(cache_ttl)),
            detection_timeout,
        }
    }

    /// Detect Docker with caching
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

    /// Detect all runtimes
    pub async fn detect_all(&self) -> Vec<Runtime> {
        let docker_result = self.detect_docker().await;
        
        let mut all_runtimes = Vec::new();
        all_runtimes.extend(docker_result.runtimes);
        
        all_runtimes
    }

    /// Clear cache for specific runtime
    pub fn clear_cache(&self, runtime_type: &crate::types::RuntimeType) {
        self.cache.clear(runtime_type);
    }

    /// Clear all caches
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
}
