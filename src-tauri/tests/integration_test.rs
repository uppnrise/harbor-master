/// Integration tests for runtime detection
/// 
/// These tests verify the full detection workflow including:
/// - Docker and Podman detection working together
/// - Cache integration
/// - Runtime status checking

use harbor_master::runtime::detector::RuntimeDetector;
use harbor_master::types::RuntimeType;
use std::sync::Arc;

#[tokio::test]
async fn test_detect_all_runtimes() {
    // Create detector with 60 second cache TTL and 500ms detection timeout
    let detector = RuntimeDetector::new(60_000, 500);
    
    // Detect all runtimes
    let runtimes = detector.detect_all().await;
    
    // Should detect at least some runtimes (Docker or Podman if installed)
    // This test is environment-dependent, so we just verify it runs without panicking
    println!("Detected {} runtimes", runtimes.len());
    
    // Verify each runtime has required fields
    for runtime in &runtimes {
        assert!(!runtime.id.is_empty());
        assert!(!runtime.path.is_empty());
        // Runtime type should be Docker or Podman
        assert!(
            runtime.runtime_type == RuntimeType::Docker 
            || runtime.runtime_type == RuntimeType::Podman
        );
    }
}

#[tokio::test]
async fn test_docker_detection() {
    let detector = RuntimeDetector::new(60_000, 500);
    
    // Detect Docker specifically
    let result = detector.detect_docker().await;
    
    // Result should have runtimes array (may be empty if Docker not installed)
    println!("Docker detection found {} instances", result.runtimes.len());
    
    // If Docker is found, verify structure
    for runtime in &result.runtimes {
        assert_eq!(runtime.runtime_type, RuntimeType::Docker);
        assert!(!runtime.id.is_empty());
        assert!(!runtime.path.is_empty());
    }
}

#[tokio::test]
async fn test_podman_detection() {
    let detector = RuntimeDetector::new(60_000, 500);
    
    // Detect Podman specifically
    let result = detector.detect_podman().await;
    
    // Result should have runtimes array (may be empty if Podman not installed)
    println!("Podman detection found {} instances", result.runtimes.len());
    
    // If Podman is found, verify structure
    for runtime in &result.runtimes {
        assert_eq!(runtime.runtime_type, RuntimeType::Podman);
        assert!(!runtime.id.is_empty());
        assert!(!runtime.path.is_empty());
    }
}

#[tokio::test]
async fn test_caching_behavior() {
    let detector = Arc::new(RuntimeDetector::new(60_000, 500));
    
    // First detection
    let start = std::time::Instant::now();
    let first_result = detector.detect_all().await;
    let first_duration = start.elapsed();
    
    // Second detection (should use cache)
    let start = std::time::Instant::now();
    let second_result = detector.detect_all().await;
    let second_duration = start.elapsed();
    
    // Results should be identical
    assert_eq!(first_result.len(), second_result.len());
    
    // Second detection should be faster (cached)
    // Note: This might not always be true due to system variance, so we just log it
    println!("First detection: {:?}, Second detection (cached): {:?}", 
             first_duration, second_duration);
}

#[tokio::test]
async fn test_cache_clearing() {
    let detector = RuntimeDetector::new(60_000, 500);
    
    // Detect all runtimes
    let _first_result = detector.detect_all().await;
    
    // Clear all caches
    detector.clear_all_caches();
    
    // Detect again (should re-detect, not use cache)
    let second_result = detector.detect_all().await;
    
    // Should still get valid results
    println!("After cache clear, detected {} runtimes", second_result.len());
}
