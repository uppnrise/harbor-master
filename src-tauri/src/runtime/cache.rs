// Detection cache with TTL
use std::time::{Duration, Instant};
use std::sync::{Arc, Mutex};
use crate::types::{DetectionResult, RuntimeType};

/// Cache entry with TTL
struct CacheEntry {
    result: DetectionResult,
    expires_at: Instant,
}

/// Detection result cache with TTL
pub struct DetectionCache {
    entries: Arc<Mutex<std::collections::HashMap<RuntimeType, CacheEntry>>>,
    ttl: Duration,
}

impl DetectionCache {
    pub fn new(ttl_seconds: u64) -> Self {
        Self {
            entries: Arc::new(Mutex::new(std::collections::HashMap::new())),
            ttl: Duration::from_secs(ttl_seconds),
        }
    }

    /// Get cached result if not expired
    pub fn get(&self, runtime_type: &RuntimeType) -> Option<DetectionResult> {
        let entries = self.entries.lock().ok()?;
        
        if let Some(entry) = entries.get(runtime_type) {
            if Instant::now() < entry.expires_at {
                return Some(entry.result.clone());
            }
        }
        
        None
    }

    /// Store result with TTL
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

    /// Clear cache for specific runtime type
    pub fn clear(&self, runtime_type: &RuntimeType) {
        if let Ok(mut entries) = self.entries.lock() {
            entries.remove(runtime_type);
        }
    }

    /// Clear all cache entries
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

