// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod config;
mod polling;
mod runtime;
mod types;

use tauri::{Emitter, Manager, menu::{MenuBuilder, SubmenuBuilder, MenuItemBuilder}};

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
            // Build the menu
            let refresh_item = MenuItemBuilder::with_id("refresh", "Refresh Runtimes")
                .accelerator("CmdOrCtrl+R")
                .build(app)?;
            
            let view_menu = SubmenuBuilder::new(app, "View")
                .item(&refresh_item)
                .build()?;
            
            let menu = MenuBuilder::new(app)
                .item(&view_menu)
                .build()?;
            
            app.set_menu(menu)?;
            
            // Handle menu item clicks
            app.on_menu_event(move |app, event| {
                if event.id() == "refresh" {
                    // Emit refresh event that App.tsx can listen to
                    let _ = app.emit("menu-refresh", ());
                }
            });
            
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
