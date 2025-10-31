use crate::config::preferences::{load_preferences, save_preferences};
use crate::polling::PollingService;
use crate::runtime::detector::RuntimeDetector;
use crate::types::{DetectionResult, RuntimePreferences};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Window};

pub mod container;

// Global detector instance
lazy_static::lazy_static! {
    static ref DETECTOR: Arc<RuntimeDetector> = Arc::new(RuntimeDetector::new(60, 500));
    static ref POLLING_SERVICE: Arc<PollingService> = Arc::new(PollingService::new(5));
}

// Initialize detector (called from main.rs)
pub fn init_detector() {
    // Force initialization of lazy_static
    let _detector = &*DETECTOR;
}

#[tauri::command]
pub async fn save_window_size(_window: Window, _width: f64, _height: f64) -> Result<(), String> {
    let prefs = load_preferences().map_err(|e| e.to_string())?;

    // Store window dimensions (we'll add these fields to RuntimePreferences later)
    // For now, just save the preferences to ensure the mechanism works
    save_preferences(&prefs).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_window_size() -> Result<(f64, f64), String> {
    // Default window size from tauri.conf.json
    Ok((1200.0, 800.0))
}

#[tauri::command]
pub async fn detect_runtimes(app: AppHandle) -> Result<DetectionResult, String> {
    // Emit detection started event
    app.emit("detection-started", ())
        .map_err(|e| e.to_string())?;

    // Run detection
    let all_runtimes = DETECTOR.detect_all().await;

    // Create detection result
    let result = DetectionResult {
        runtimes: all_runtimes,
        detected_at: chrono::Utc::now(),
        duration: 0, // Combined duration handled by detector
        errors: vec![],
    };

    // Emit detection completed event with runtimes
    app.emit("detection-completed", &result)
        .map_err(|e| e.to_string())?;

    Ok(result)
}

#[tauri::command]
pub async fn get_runtime_preferences() -> Result<RuntimePreferences, String> {
    load_preferences().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_runtime_preferences(prefs: RuntimePreferences) -> Result<(), String> {
    save_preferences(&prefs).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn select_runtime(app: AppHandle, runtime_id: String) -> Result<(), String> {
    let mut prefs = load_preferences().map_err(|e| e.to_string())?;
    prefs.selected_runtime_id = Some(runtime_id.clone());
    save_preferences(&prefs).map_err(|e| e.to_string())?;

    // Emit runtime selected event
    app.emit("runtime-selected", runtime_id)
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn clear_detection_cache() -> Result<(), String> {
    DETECTOR.clear_all_caches();
    Ok(())
}

#[tauri::command]
pub async fn start_status_polling(app: AppHandle) -> Result<(), String> {
    // Get current runtimes from detector
    let runtimes = DETECTOR.detect_all().await;

    // Update polling service with runtimes
    POLLING_SERVICE.set_runtimes(runtimes).await;

    // Start polling
    POLLING_SERVICE.start(app).await
}

#[tauri::command]
pub async fn stop_status_polling() -> Result<(), String> {
    POLLING_SERVICE.stop().await;
    Ok(())
}

#[tauri::command]
pub fn get_platform() -> String {
    std::env::consts::OS.to_string()
}
