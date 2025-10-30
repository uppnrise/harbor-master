use tauri::{Manager, Window, AppHandle, Emitter};
use crate::config::preferences::{load_preferences, save_preferences};
use crate::types::{RuntimePreferences, DetectionResult};
use crate::runtime::detector::RuntimeDetector;
use std::sync::Arc;

// Global detector instance
lazy_static::lazy_static! {
    static ref DETECTOR: Arc<RuntimeDetector> = Arc::new(RuntimeDetector::new(60, 500));
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
    app.emit("detection-started", ()).map_err(|e| e.to_string())?;
    
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
    app.emit("detection-completed", &result).map_err(|e| e.to_string())?;
    
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
    app.emit("runtime-selected", runtime_id).map_err(|e| e.to_string())?;
    
    Ok(())
}
