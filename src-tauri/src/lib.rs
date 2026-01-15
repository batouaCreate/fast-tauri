mod printer;
mod db;
mod commands;

use commands::AppState;
use std::sync::Mutex;
use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            println!("🚀 [STARTUP] Démarrage de l'application Fast-App");

            // Initialiser la base de données
            println!("💾 [STARTUP] Initialisation de la base de données SQLite...");
            let db = db::Database::new(&app.handle())
                .expect("Erreur lors de l'initialisation de la base de données");

            // Afficher le chemin de la BD
            let app_dir = app.handle()
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir");
            let db_path = app_dir.join("fast_app.db");
            println!("📁 [STARTUP] Base de données créée à: {:?}", db_path);

            println!("🔧 [STARTUP] Création des tables...");
            db.init()
                .expect("Erreur lors de la création des tables");
            println!("✅ [STARTUP] Tables créées avec succès");

            // Stocker la DB dans l'état de l'application
            app.manage(AppState {
                db: Mutex::new(db),
            });
            println!("✅ [STARTUP] Base de données prête");

            // Démarrer le worker de synchronisation en arrière-plan
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let app_dir = app_handle
                    .path()
                    .app_data_dir()
                    .expect("Failed to get app data dir");
                let db_path = app_dir.join("fast_app.db");

                // URL de l'API - correspond à API_CONFIG.baseUrl dans src/config/api.config.ts
                let api_base_url = "https://guichet.createsarl.com/api".to_string();

                // Lancer le worker de sync toutes les 30 secondes
                db::sync::start_sync_worker(db_path, api_base_url, 30).await;
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            printer::print_ticket,
            printer::print_stub_and_ticket,
            printer::list_printers,
            printer::print_raw_data,
            // Commandes offline
            commands::create_departure_offline,
            commands::get_all_departures_offline,
            commands::get_departure_by_id_offline,
            commands::sync_departures,
            commands::sync_tickets,
            commands::sell_ticket_offline,
            commands::get_all_tickets_offline,
            commands::get_tickets_by_departure_offline,
            commands::get_ticket_by_id_offline,
            commands::create_colis_offline,
            commands::get_colis_by_id_offline,
            commands::create_bagage_offline,
            commands::get_bagage_by_id_offline,
            commands::get_sync_status,
            commands::force_sync,
            // Commandes pour agences et destinations
            commands::sync_agences,
            commands::get_all_agences_offline,
            commands::sync_destinations,
            commands::get_all_destinations_offline,
            commands::get_destinations_by_agence_offline,
            commands::get_db_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
