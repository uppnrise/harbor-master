use crate::types::RuntimePreferences;
use serde_json;
use std::error::Error;
use std::fs;
use std::path::PathBuf;

/// Get the config directory path based on platform
pub fn get_config_dir() -> Result<PathBuf, Box<dyn Error>> {
    let config_dir = if cfg!(target_os = "windows") {
        // Windows: %APPDATA%\harbormaster
        let appdata = std::env::var("APPDATA")?;
        PathBuf::from(appdata).join("harbormaster")
    } else if cfg!(target_os = "macos") {
        // macOS: ~/Library/Application Support/com.harbormaster.app
        let home = std::env::var("HOME")?;
        PathBuf::from(home)
            .join("Library")
            .join("Application Support")
            .join("com.harbormaster.app")
    } else {
        // Linux: ~/.config/harbormaster
        let home = std::env::var("HOME")?;
        PathBuf::from(home).join(".config").join("harbormaster")
    };

    // Create directory if it doesn't exist
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir)?;
    }

    Ok(config_dir)
}

/// Get the full path to the config file
pub fn get_config_path() -> Result<PathBuf, Box<dyn Error>> {
    Ok(get_config_dir()?.join("config.json"))
}

/// Load preferences from config file
/// Returns default preferences if file doesn't exist
pub fn load_preferences() -> Result<RuntimePreferences, Box<dyn Error>> {
    let config_path = get_config_path()?;

    if !config_path.exists() {
        return Ok(RuntimePreferences::default());
    }

    let contents = fs::read_to_string(config_path)?;
    let prefs: RuntimePreferences = serde_json::from_str(&contents)?;

    Ok(prefs)
}

/// Save preferences to config file
pub fn save_preferences(prefs: &RuntimePreferences) -> Result<(), Box<dyn Error>> {
    let config_path = get_config_path()?;
    let contents = serde_json::to_string_pretty(prefs)?;

    fs::write(config_path, contents)?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_dir_not_empty() {
        let dir = get_config_dir().unwrap();
        assert!(!dir.as_os_str().is_empty());
    }

    #[test]
    fn test_default_preferences() {
        let prefs = RuntimePreferences::default();
        assert!(prefs.auto_select_running);
        assert_eq!(prefs.detection_cache_ttl, 60);
        assert_eq!(prefs.status_poll_interval, 5);
    }
}
