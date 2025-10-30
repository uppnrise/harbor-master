// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod config;
mod polling;
mod runtime;
mod types;

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            // Window management
            commands::save_window_size,
            commands::get_window_size,
            // Runtime detection commands (to be implemented)
            // commands::runtime::detect_runtimes,
            // commands::runtime::check_runtime_status,
            // commands::runtime::get_runtime_preferences,
            // commands::runtime::set_runtime_preferences,
            // commands::runtime::select_runtime,
            // commands::runtime::start_status_polling,
            // commands::runtime::stop_status_polling,
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
