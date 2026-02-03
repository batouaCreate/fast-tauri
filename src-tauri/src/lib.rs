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

            // Synchroniser les données utilisateurs au démarrage
            let app_handle_sync = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                println!("🔄 [STARTUP] Synchronisation des données utilisateurs...");

                let client = reqwest::Client::new();
                match client.get("https://guichet.createsarl.com/api/users").send().await {
                    Ok(response) => {
                        match response.json::<serde_json::Value>().await {
                            Ok(json_data) => {
                                if let Some(data_array) = json_data.get("data").and_then(|d| d.as_array()) {
                                    println!("📦 [STARTUP] {} enregistrements reçus", data_array.len());

                                    // Séparer les données par type
                                    let mut entreprises = Vec::new();
                                    let mut agences = Vec::new();
                                    let mut users = Vec::new();

                                    // Créer des sets pour dédupliquer
                                    let mut etp_ids = std::collections::HashSet::new();
                                    let mut ag_ids = std::collections::HashSet::new();
                                    let mut us_ids = std::collections::HashSet::new();

                                    for item in data_array {
                                        // Extraire entreprise
                                        if let Some(etp_id) = item.get("etp_id").and_then(|v| v.as_i64()) {
                                            if etp_ids.insert(etp_id) {
                                                let mut etp = serde_json::Map::new();
                                                for (key, value) in item.as_object().unwrap() {
                                                    if key.starts_with("etp_") || key == "etp_id" {
                                                        etp.insert(key.clone(), value.clone());
                                                    }
                                                }
                                                entreprises.push(serde_json::Value::Object(etp));
                                            }
                                        }

                                        // Extraire agence
                                        if let Some(ag_id) = item.get("ag_id").and_then(|v| v.as_i64()) {
                                            if ag_ids.insert(ag_id) {
                                                let mut ag = serde_json::Map::new();
                                                for (key, value) in item.as_object().unwrap() {
                                                    if key.starts_with("ag_") || key == "ag_id" {
                                                        ag.insert(key.clone(), value.clone());
                                                    }
                                                }
                                                agences.push(serde_json::Value::Object(ag));
                                            }
                                        }

                                        // Extraire user
                                        if let Some(us_id) = item.get("us_id").and_then(|v| v.as_i64()) {
                                            if us_ids.insert(us_id) {
                                                let mut us = serde_json::Map::new();
                                                for (key, value) in item.as_object().unwrap() {
                                                    if key.starts_with("us_") || key == "us_id" {
                                                        us.insert(key.clone(), value.clone());
                                                    }
                                                }
                                                users.push(serde_json::Value::Object(us));
                                            }
                                        }
                                    }

                                    println!("📊 [STARTUP] Données séparées: {} entreprises, {} agences, {} users",
                                        entreprises.len(), agences.len(), users.len());

                                    // Obtenir la connexion à la BD
                                    let app_dir = app_handle_sync
                                        .path()
                                        .app_data_dir()
                                        .expect("Failed to get app data dir");
                                    let db_path = app_dir.join("fast_app.db");

                                    if let Ok(conn) = rusqlite::Connection::open(&db_path) {
                                        // Synchroniser entreprises
                                        if !entreprises.is_empty() {
                                            match db::operations::sync_entreprises_from_api(&conn, entreprises.clone()) {
                                                Ok(count) => println!("✅ [STARTUP] {} entreprises synchronisées", count),
                                                Err(e) => println!("❌ [STARTUP] Erreur sync entreprises: {}", e),
                                            }

                                            // Télécharger les images des entreprises
                                            for etp in &entreprises {
                                                if let (Some(etp_id), Some(etp_img)) = (
                                                    etp.get("etp_id").and_then(|v| v.as_i64()),
                                                    etp.get("etp_img").and_then(|v| v.as_str())
                                                ) {
                                                    if !etp_img.is_empty() {
                                                        println!("📥 [STARTUP] Téléchargement image pour entreprise {}", etp_id);
                                                        match db::operations::download_entreprise_image(
                                                            &db_path,
                                                            etp_id,
                                                            etp_img,
                                                            &app_dir
                                                        ).await {
                                                            Ok(path) => println!("✅ [STARTUP] Image téléchargée: {}", path),
                                                            Err(e) => println!("⚠️ [STARTUP] Erreur téléchargement image: {}", e),
                                                        }
                                                    }
                                                }
                                            }
                                        }

                                        // Synchroniser agences
                                        if !agences.is_empty() {
                                            match db::operations::sync_agences_from_api(&conn, agences) {
                                                Ok(count) => println!("✅ [STARTUP] {} agences synchronisées", count),
                                                Err(e) => println!("❌ [STARTUP] Erreur sync agences: {}", e),
                                            }
                                        }

                                        // Synchroniser users
                                        if !users.is_empty() {
                                            match db::operations::sync_users_from_api(&conn, users) {
                                                Ok(count) => println!("✅ [STARTUP] {} utilisateurs synchronisés", count),
                                                Err(e) => println!("❌ [STARTUP] Erreur sync users: {}", e),
                                            }
                                        }
                                    } else {
                                        println!("❌ [STARTUP] Impossible d'ouvrir la connexion BD");
                                    }
                                } else {
                                    println!("⚠️ [STARTUP] Format de réponse inattendu");
                                }
                            }
                            Err(e) => println!("❌ [STARTUP] Erreur parsing JSON: {}", e),
                        }
                    }
                    Err(e) => println!("❌ [STARTUP] Erreur appel API: {}", e),
                }
            });

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
            // Commandes pour entreprises et users
            commands::sync_entreprises,
            commands::get_all_entreprises_offline,
            commands::sync_users,
            commands::get_all_users_offline,
            commands::get_db_info,
            // Commandes pour synchronisation manuelle
            commands::sync_users_data,
            // Commandes pour l'authentification
            commands::login_offline,
            // Commandes pour les statistiques
            commands::get_ticket_statistics,
            // Commandes pour synchroniser les tickets par utilisateur
            commands::sync_tickets_by_user
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
