//! Detection result caching with time-to-live (TTL)
//!
//! This module provides a thread-safe cache for runtime detection results
//! to avoid expensive repeated detections. Each cache entry expires after
//! a configurable TTL period.

use std::time::{Duration, Instant};
use std::sync::{Arc, Mutex};
use crate::types::{DetectionResult, RuntimeType};

/// Internal cache entry with expiration timestamp
struct CacheEntry {
    /// The cached detection result
    result: DetectionResult,
    /// Absolute time when this entry expires
    expires_at: Instant,
}

/// Thread-safe cache for detection results with automatic expiration
/// 
/// # Example
/// ```
/// use harbor_master::runtime::cache::DetectionCache;
/// use harbor_master::types::{RuntimeType, DetectionResult};
/// use chrono::Utc;
/// 
/// let cache = DetectionCache::new(60); // 60 second TTL
/// 
/// // Cache is empty initially
/// assert!(cache.get(&RuntimeType::Docker).is_none());
/// 
/// // Store a result (DetectionResult with empty runtimes for demo)
/// let result = DetectionResult {
///     runtimes: vec![],
///     errors: vec![],
///     detected_at: Utc::now(),
///     duration: 100,
/// };
/// cache.set(RuntimeType::Docker, result);
/// 
/// // Retrieve within TTL
/// assert!(cache.get(&RuntimeType::Docker).is_some());
/// ```
pub struct DetectionCache {
    /// Thread-safe storage of cached entries per runtime type
    entries: Arc<Mutex<std::collections::HashMap<RuntimeType, CacheEntry>>>,
    /// Duration before cached entries expire
    ttl: Duration,
}

impl DetectionCache {
    /// Creates a new cache with specified TTL
    /// 
    /// # Arguments
    /// * `ttl_seconds` - Time-to-live in seconds for cache entries
    /// 
    /// # Returns
    /// New `DetectionCache` instance
    pub fn new(ttl_seconds: u64) -> Self {
        Self {
            entries: Arc::new(Mutex::new(std::collections::HashMap::new())),
            ttl: Duration::from_secs(ttl_seconds),
        }
    }

    /// Retrieves a cached result if it hasn't expired
    /// 
    /// # Arguments
    /// * `runtime_type` - The runtime type to look up
    /// 
    /// # Returns
    /// - `Some(DetectionResult)` if cached and not expired
    /// - `None` if not in cache or expired
    pub fn get(&self, runtime_type: &RuntimeType) -> Option<DetectionResult> {
        let entries = self.entries.lock().ok()?;
        
        if let Some(entry) = entries.get(runtime_type) {
            if Instant::now() < entry.expires_at {
                return Some(entry.result.clone());
            }
        }
        
        None
    }

    /// Stores a detection result with automatic expiration
    /// 
    /// # Arguments
    /// * `runtime_type` - The runtime type this result belongs to
    /// * `result` - The detection result to cache
    pub fn set(&self, runtime_type: RuntimeType, result: DetectionResult) {
        let expires_at = Instant::now() + self.ttl;
        let entry = CacheEntry {
            result,
            expires_at,
        };

        if let Ok(mut entries) = self.entries.lock() {
            entries.insert(runtime_type, entry);
        }
    }

    /// Removes the cache entry for a specific runtime type
    /// 
    /// # Arguments
    /// * `runtime_type` - The runtime type to clear from cache
    #[allow(dead_code)]
    pub fn clear(&self, runtime_type: &RuntimeType) {
        if let Ok(mut entries) = self.entries.lock() {
            entries.remove(runtime_type);
        }
    }

    /// Removes all cache entries
    /// 
    /// Useful for manual refresh operations where fresh detection is required.
    pub fn clear_all(&self) {
        if let Ok(mut entries) = self.entries.lock() {
            entries.clear();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::thread;

    #[test]
    fn test_cache_get_set() {
        let cache = DetectionCache::new(60);
        let result = DetectionResult {
            runtimes: vec![],
            detected_at: chrono::Utc::now(),
            duration: 100,
            errors: vec![],
        };

        cache.set(RuntimeType::Docker, result.clone());
        let cached = cache.get(&RuntimeType::Docker);
        
        assert!(cached.is_some());
    }

    #[test]
    fn test_cache_expiration() {
        let cache = DetectionCache::new(1); // 1 second TTL
        let result = DetectionResult {
            runtimes: vec![],
            detected_at: chrono::Utc::now(),
            duration: 100,
            errors: vec![],
        };

        cache.set(RuntimeType::Docker, result);
        
        // Should be cached
        assert!(cache.get(&RuntimeType::Docker).is_some());
        
        // Wait for expiration
        thread::sleep(Duration::from_secs(2));
        
        // Should be expired
        assert!(cache.get(&RuntimeType::Docker).is_none());
    }

    #[test]
    fn test_cache_clear() {
        let cache = DetectionCache::new(60);
        let result = DetectionResult {
            runtimes: vec![],
            detected_at: chrono::Utc::now(),
            duration: 100,
            errors: vec![],
        };

        cache.set(RuntimeType::Docker, result);
        cache.clear(&RuntimeType::Docker);
        
        assert!(cache.get(&RuntimeType::Docker).is_none());
    }
}

