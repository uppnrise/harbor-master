// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod config;
mod polling;
mod runtime;
mod types;

use tauri::Manager;

fn main() {
    // Initialize detector before building the app
    commands::init_detector();
    
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            // Window management
            commands::save_window_size,
            commands::get_window_size,
            // Runtime detection commands
            commands::detect_runtimes,
            commands::get_runtime_preferences,
            commands::set_runtime_preferences,
            commands::select_runtime,
            commands::clear_detection_cache,
            // Status polling commands
            commands::start_status_polling,
            commands::stop_status_polling,
            // Platform info
            commands::get_platform,
        ])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
