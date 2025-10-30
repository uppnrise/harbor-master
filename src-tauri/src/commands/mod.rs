use tauri::{Manager, Window};
use crate::config::preferences::{load_preferences, save_preferences};
use crate::types::RuntimePreferences;

#[tauri::command]
pub async fn save_window_size(window: Window, width: f64, height: f64) -> Result<(), String> {
    let mut prefs = load_preferences().map_err(|e| e.to_string())?;
    
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

// Runtime detection commands
// To be implemented in later phases
