use crate::db::{models::*, operations::*, Database};
use crate::db::operations::{sync_agences_from_api, get_all_agences, get_agences_by_entreprise, sync_destinations_from_api, get_all_destinations, get_destinations_by_agence, sync_departures_from_api, get_ticket_stats, sync_entreprises_from_api, get_all_entreprises, sync_users_from_api, get_all_users, get_user_by_phone};
use tauri::{State, Manager};
use std::sync::Mutex;
use sha1::{Sha1, Digest};

pub struct AppState {
    pub db: Mutex<Database>,
}

// ============== DEPARTURES ==============

#[tauri::command]
pub fn create_departure_offline(
    state: State<AppState>,
    request: CreateDepartureRequest,
    ag_id: i64,
) -> Result<Departure, String> {
    let db = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    create_departure(&db.conn, &request, ag_id)
        .map_err(|e| format!("DB error: {}", e))
}

#[tauri::command]
pub fn get_all_departures_offline(
    state: State<AppState>,
    user_id: i64,
) -> Result<Vec<Departure>, String> {
    let db = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    get_all_departures(&db.conn, user_id)
        .map_err(|e| format!("DB error: {}", e))
}

#[tauri::command]
pub fn get_departure_by_id_offline(
    state: State<AppState>,
    id: i64,
) -> Result<Departure, String> {
    let db = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    get_departure_by_id(&db.conn, id)
        .map_err(|e| format!("DB error: {}", e))
}

#[tauri::command]
pub fn sync_departures(
    state: State<AppState>,
    departures_json: String,
) -> Result<usize, String> {
    println!("🔄 [RUST] sync_departures appelé");
    println!("📊 [RUST] JSON reçu (taille): {} bytes", departures_json.len());

    let db = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    let departures_data: Vec<serde_json::Value> = serde_json::from_str(&departures_json)
        .map_err(|e| {
            println!("❌ [RUST] Erreur parsing JSON: {}", e);
            format!("JSON parse error: {}", e)
        })?;

    println!("📦 [RUST] Nombre de départs à synchroniser: {}", departures_data.len());

    let result = sync_departures_from_api(&db.conn, departures_data)
        .map_err(|e| {
            println!("❌ [RUST] Erreur DB: {}", e);
            format!("DB error: {}", e)
        })?;

    println!("✅ [RUST] {} départs synchronisés avec succès", result);
    Ok(result)
}

// ============== TICKETS ==============

#[tauri::command]
pub fn sync_tickets(
    state: State<AppState>,
    tickets_json: String,
) -> Result<usize, String> {
    println!("🔄 [RUST] sync_tickets appelé");
    println!("📊 [RUST] JSON reçu (taille): {} bytes", tickets_json.len());

    let db = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    let tickets_data: Vec<serde_json::Value> = serde_json::from_str(&tickets_json)
        .map_err(|e| {
            println!("❌ [RUST] Erreur parsing JSON: {}", e);
            format!("JSON parse error: {}", e)
        })?;

    println!("📦 [RUST] Nombre de tickets à synchroniser: {}", tickets_data.len());

    let result = sync_tickets_from_api(&db.conn, tickets_data)
        .map_err(|e| {
            println!("❌ [RUST] Erreur DB: {}", e);
            format!("DB error: {}", e)
        })?;

    println!("✅ [RUST] {} tickets synchronisés avec succès (sans doublons)", result);
    Ok(result)
}

#[tauri::command]
pub fn sell_ticket_offline(
    state: State<AppState>,
    request: SellTicketRequest,
) -> Result<Ticket, String> {
    let db = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    create_ticket(&db.conn, &request)
        .map_err(|e| format!("DB error: {}", e))
}

#[tauri::command]
pub fn get_all_tickets_offline(
    state: State<AppState>,
    user_id: i64,
) -> Result<Vec<Ticket>, String> {
    let db = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    get_all_tickets(&db.conn, user_id)
        .map_err(|e| format!("DB error: {}", e))
}

#[tauri::command]
pub fn get_tickets_by_departure_offline(
    state: State<AppState>,
    departure_id: i64,
) -> Result<Vec<Ticket>, String> {
    let db = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    get_tickets_by_departure(&db.conn, departure_id)
        .map_err(|e| format!("DB error: {}", e))
}

#[tauri::command]
pub fn get_ticket_by_id_offline(
    state: State<AppState>,
    id: i64,
) -> Result<Ticket, String> {
    let db = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    get_ticket_by_id(&db.conn, id)
        .map_err(|e| format!("DB error: {}", e))
}

// ============== COLIS ==============

#[tauri::command]
pub fn create_colis_offline(
    state: State<AppState>,
    request: CreateColisRequest,
    numcar: String,
) -> Result<Colis, String> {
    let db = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    create_colis(&db.conn, &request, &numcar)
        .map_err(|e| format!("DB error: {}", e))
}

#[tauri::command]
pub fn get_colis_by_id_offline(
    state: State<AppState>,
    id: i64,
) -> Result<Colis, String> {
    let db = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    get_colis_by_id(&db.conn, id)
        .map_err(|e| format!("DB error: {}", e))
}

// ============== BAGAGES ==============

#[tauri::command]
pub fn create_bagage_offline(
    state: State<AppState>,
    request: CreateBagageRequest,
    numcar: String,
) -> Result<Bagage, String> {
    let db = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    create_bagage(&db.conn, &request, &numcar)
        .map_err(|e| format!("DB error: {}", e))
}

#[tauri::command]
pub fn get_bagage_by_id_offline(
    state: State<AppState>,
    id: i64,
) -> Result<Bagage, String> {
    let db = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    get_bagage_by_id(&db.conn, id)
        .map_err(|e| format!("DB error: {}", e))
}

// ============== SYNC STATUS ==============

#[tauri::command]
pub fn get_sync_status(state: State<AppState>) -> Result<SyncStatusInfo, String> {
    let db = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    let pending_departures = db.conn
        .query_row(
            "SELECT COUNT(*) FROM departures WHERE sync_status = 'pending'",
            [],
            |row| row.get::<_, i64>(0),
        )
        .unwrap_or(0);

    let pending_tickets = db.conn
        .query_row(
            "SELECT COUNT(*) FROM tickets WHERE sync_status = 'pending'",
            [],
            |row| row.get::<_, i64>(0),
        )
        .unwrap_or(0);

    let error_departures = db.conn
        .query_row(
            "SELECT COUNT(*) FROM departures WHERE sync_status = 'error'",
            [],
            |row| row.get::<_, i64>(0),
        )
        .unwrap_or(0);

    let error_tickets = db.conn
        .query_row(
            "SELECT COUNT(*) FROM tickets WHERE sync_status = 'error'",
            [],
            |row| row.get::<_, i64>(0),
        )
        .unwrap_or(0);

    Ok(SyncStatusInfo {
        pending_departures,
        pending_tickets,
        error_departures,
        error_tickets,
    })
}

#[derive(serde::Serialize)]
pub struct SyncStatusInfo {
    pub pending_departures: i64,
    pub pending_tickets: i64,
    pub error_departures: i64,
    pub error_tickets: i64,
}

// ============== AGENCES ==============

#[tauri::command]
pub fn sync_agences(
    state: State<AppState>,
    agences_json: String,
) -> Result<usize, String> {
    println!("🔄 [RUST] sync_agences appelé");
    println!("📊 [RUST] JSON reçu (taille): {} bytes", agences_json.len());

    let db = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    let agences_data: Vec<serde_json::Value> = serde_json::from_str(&agences_json)
        .map_err(|e| {
            println!("❌ [RUST] Erreur parsing JSON: {}", e);
            format!("JSON parse error: {}", e)
        })?;

    println!("📦 [RUST] Nombre d'agences à synchroniser: {}", agences_data.len());

    let result = sync_agences_from_api(&db.conn, agences_data)
        .map_err(|e| {
            println!("❌ [RUST] Erreur DB: {}", e);
            format!("DB error: {}", e)
        })?;

    println!("✅ [RUST] {} agences synchronisées avec succès", result);
    Ok(result)
}

#[tauri::command]
pub fn get_all_agences_offline(state: State<AppState>) -> Result<Vec<Agence>, String> {
    println!("📖 [RUST] get_all_agences_offline appelé");
    let db = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let result = get_all_agences(&db.conn)
        .map_err(|e| format!("DB error: {}", e))?;
    println!("📦 [RUST] {} agences récupérées de la BD", result.len());
    Ok(result)
}

#[tauri::command]
pub fn get_agences_by_entreprise_offline(
    state: State<AppState>,
    etp_id: i64,
) -> Result<Vec<Agence>, String> {
    println!("📖 [RUST] get_agences_by_entreprise_offline appelé pour etp_id: {}", etp_id);
    let db = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let result = get_agences_by_entreprise(&db.conn, etp_id)
        .map_err(|e| format!("DB error: {}", e))?;
    println!("📦 [RUST] {} agences récupérées pour l'entreprise {}", result.len(), etp_id);
    Ok(result)
}

// ============== DESTINATIONS ==============

#[tauri::command]
pub fn sync_destinations(
    state: State<AppState>,
    destinations_json: String,
) -> Result<usize, String> {
    println!("🔄 [RUST] sync_destinations appelé");
    println!("📊 [RUST] JSON reçu (taille): {} bytes", destinations_json.len());

    let db = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    let destinations_data: Vec<serde_json::Value> = serde_json::from_str(&destinations_json)
        .map_err(|e| {
            println!("❌ [RUST] Erreur parsing JSON: {}", e);
            format!("JSON parse error: {}", e)
        })?;

    println!("📦 [RUST] Nombre de destinations à synchroniser: {}", destinations_data.len());

    let result = sync_destinations_from_api(&db.conn, destinations_data)
        .map_err(|e| {
            println!("❌ [RUST] Erreur DB: {}", e);
            format!("DB error: {}", e)
        })?;

    println!("✅ [RUST] {} destinations synchronisées avec succès", result);
    Ok(result)
}

#[tauri::command]
pub fn get_all_destinations_offline(state: State<AppState>) -> Result<Vec<Destination>, String> {
    println!("📖 [RUST] get_all_destinations_offline appelé");
    let db = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let result = get_all_destinations(&db.conn)
        .map_err(|e| format!("DB error: {}", e))?;
    println!("📦 [RUST] {} destinations récupérées de la BD", result.len());
    Ok(result)
}

#[tauri::command]
pub fn get_destinations_by_agence_offline(
    state: State<AppState>,
    agence_id: i64,
) -> Result<Vec<Destination>, String> {
    let db = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    get_destinations_by_agence(&db.conn, agence_id)
        .map_err(|e| format!("DB error: {}", e))
}

// ============== ENTREPRISES ==============

#[tauri::command]
pub fn sync_entreprises(
    state: State<AppState>,
    entreprises_json: String,
) -> Result<usize, String> {
    println!("🔄 [RUST] sync_entreprises appelé");
    println!("📊 [RUST] JSON reçu (taille): {} bytes", entreprises_json.len());

    let db = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    let entreprises_data: Vec<serde_json::Value> = serde_json::from_str(&entreprises_json)
        .map_err(|e| {
            println!("❌ [RUST] Erreur parsing JSON: {}", e);
            format!("JSON parse error: {}", e)
        })?;

    println!("📦 [RUST] Nombre d'entreprises à synchroniser: {}", entreprises_data.len());

    let result = sync_entreprises_from_api(&db.conn, entreprises_data)
        .map_err(|e| {
            println!("❌ [RUST] Erreur DB: {}", e);
            format!("DB error: {}", e)
        })?;

    println!("✅ [RUST] {} entreprises synchronisées avec succès", result);
    Ok(result)
}

#[tauri::command]
pub fn get_all_entreprises_offline(state: State<AppState>) -> Result<Vec<Entreprise>, String> {
    println!("📖 [RUST] get_all_entreprises_offline appelé");
    let db = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let result = get_all_entreprises(&db.conn)
        .map_err(|e| format!("DB error: {}", e))?;
    println!("📦 [RUST] {} entreprises récupérées de la BD", result.len());
    Ok(result)
}

// ============== USERS ==============

#[tauri::command]
pub fn sync_users(
    state: State<AppState>,
    users_json: String,
) -> Result<usize, String> {
    println!("🔄 [RUST] sync_users appelé");
    println!("📊 [RUST] JSON reçu (taille): {} bytes", users_json.len());

    let db = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    let users_data: Vec<serde_json::Value> = serde_json::from_str(&users_json)
        .map_err(|e| {
            println!("❌ [RUST] Erreur parsing JSON: {}", e);
            format!("JSON parse error: {}", e)
        })?;

    println!("📦 [RUST] Nombre d'utilisateurs à synchroniser: {}", users_data.len());

    let result = sync_users_from_api(&db.conn, users_data)
        .map_err(|e| {
            println!("❌ [RUST] Erreur DB: {}", e);
            format!("DB error: {}", e)
        })?;

    println!("✅ [RUST] {} utilisateurs synchronisés avec succès", result);
    Ok(result)
}

#[tauri::command]
pub fn get_all_users_offline(state: State<AppState>) -> Result<Vec<User>, String> {
    println!("📖 [RUST] get_all_users_offline appelé");
    let db = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let result = get_all_users(&db.conn)
        .map_err(|e| format!("DB error: {}", e))?;
    println!("📦 [RUST] {} utilisateurs récupérés de la BD", result.len());
    Ok(result)
}

// ============== DIAGNOSTIC ==============

#[tauri::command]
pub fn get_db_info(state: State<AppState>) -> Result<String, String> {
    println!("🔍 [DIAGNOSTIC] get_db_info appelé");

    let db = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    // Compter les agences
    let count_agences = db.conn
        .query_row("SELECT COUNT(*) FROM agences", [], |row| row.get::<_, i64>(0))
        .unwrap_or(0);

    // Compter les destinations
    let count_destinations = db.conn
        .query_row("SELECT COUNT(*) FROM destinations", [], |row| row.get::<_, i64>(0))
        .unwrap_or(0);

    // Compter les départs
    let count_departures = db.conn
        .query_row("SELECT COUNT(*) FROM departures", [], |row| row.get::<_, i64>(0))
        .unwrap_or(0);

    // Compter les tickets
    let count_tickets = db.conn
        .query_row("SELECT COUNT(*) FROM tickets", [], |row| row.get::<_, i64>(0))
        .unwrap_or(0);

    // Compter les entreprises
    let count_entreprises = db.conn
        .query_row("SELECT COUNT(*) FROM entreprises", [], |row| row.get::<_, i64>(0))
        .unwrap_or(0);

    // Compter les utilisateurs
    let count_users = db.conn
        .query_row("SELECT COUNT(*) FROM users", [], |row| row.get::<_, i64>(0))
        .unwrap_or(0);

    let info = format!(
        "📊 Statistiques BD:\n\
         - Entreprises: {}\n\
         - Agences: {}\n\
         - Users: {}\n\
         - Destinations: {}\n\
         - Départs: {}\n\
         - Tickets: {}",
        count_entreprises, count_agences, count_users, count_destinations, count_departures, count_tickets
    );

    println!("{}", info);
    Ok(info)
}

// ============== FORCE SYNC ==============

#[tauri::command]
pub async fn force_sync(_state: State<'_, AppState>) -> Result<String, String> {
    // Cette commande pourrait déclencher une synchronisation immédiate
    // Pour l'instant, elle retourne juste un message
    Ok("Synchronisation lancée".to_string())
}

// ============== SYNC USERS DATA ==============

#[tauri::command]
pub async fn sync_users_data(app_handle: tauri::AppHandle) -> Result<String, String> {
    println!("🔄 [MANUAL SYNC] Synchronisation manuelle des données utilisateurs...");

    let client = reqwest::Client::new();
    match client.get("https://guichet.createsarl.com/api/users").send().await {
        Ok(response) => {
            match response.json::<serde_json::Value>().await {
                Ok(json_data) => {
                    if let Some(data_array) = json_data.get("data").and_then(|d| d.as_array()) {
                        println!("📦 [MANUAL SYNC] {} enregistrements reçus", data_array.len());

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

                        println!("📊 [MANUAL SYNC] Données séparées: {} entreprises, {} agences, {} users",
                            entreprises.len(), agences.len(), users.len());

                        // Obtenir la connexion à la BD
                        let app_dir = app_handle
                            .path()
                            .app_data_dir()
                            .map_err(|e| format!("Erreur app_data_dir: {}", e))?;
                        let db_path = app_dir.join("fast_app.db");

                        let conn = rusqlite::Connection::open(&db_path)
                            .map_err(|e| format!("Erreur connexion BD: {}", e))?;

                        let mut synced_count = 0;

                        // Synchroniser entreprises
                        if !entreprises.is_empty() {
                            match sync_entreprises_from_api(&conn, entreprises.clone()) {
                                Ok(count) => {
                                    println!("✅ [MANUAL SYNC] {} entreprises synchronisées", count);
                                    synced_count += count;

                                    // Télécharger les images des entreprises
                                    for etp in &entreprises {
                                        if let (Some(etp_id), Some(etp_img)) = (
                                            etp.get("etp_id").and_then(|v| v.as_i64()),
                                            etp.get("etp_img").and_then(|v| v.as_str())
                                        ) {
                                            if !etp_img.is_empty() {
                                                println!("📥 [MANUAL SYNC] Téléchargement image pour entreprise {}", etp_id);
                                                match crate::db::operations::download_entreprise_image(
                                                    &db_path,
                                                    etp_id,
                                                    etp_img,
                                                    &app_dir
                                                ).await {
                                                    Ok(path) => println!("✅ [MANUAL SYNC] Image téléchargée: {}", path),
                                                    Err(e) => println!("⚠️ [MANUAL SYNC] Erreur téléchargement image: {}", e),
                                                }
                                            }
                                        }
                                    }
                                }
                                Err(e) => {
                                    println!("❌ [MANUAL SYNC] Erreur sync entreprises: {}", e);
                                    return Err(format!("Erreur sync entreprises: {}", e));
                                }
                            }
                        }

                        // Synchroniser agences
                        if !agences.is_empty() {
                            match sync_agences_from_api(&conn, agences) {
                                Ok(count) => {
                                    println!("✅ [MANUAL SYNC] {} agences synchronisées", count);
                                    synced_count += count;
                                }
                                Err(e) => {
                                    println!("❌ [MANUAL SYNC] Erreur sync agences: {}", e);
                                    return Err(format!("Erreur sync agences: {}", e));
                                }
                            }
                        }

                        // Synchroniser users
                        if !users.is_empty() {
                            match sync_users_from_api(&conn, users) {
                                Ok(count) => {
                                    println!("✅ [MANUAL SYNC] {} utilisateurs synchronisés", count);
                                    synced_count += count;
                                }
                                Err(e) => {
                                    println!("❌ [MANUAL SYNC] Erreur sync users: {}", e);
                                    return Err(format!("Erreur sync users: {}", e));
                                }
                            }
                        }

                        Ok(format!("✅ {} données synchronisées avec succès", synced_count))
                    } else {
                        Err("Format de réponse inattendu".to_string())
                    }
                }
                Err(e) => Err(format!("Erreur parsing JSON: {}", e)),
            }
        }
        Err(e) => Err(format!("Erreur appel API: {}", e)),
    }
}

// ============== AUTHENTICATION ==============

#[derive(serde::Serialize)]
pub struct AuthResponse {
    pub user: User,
    pub agence: Agence,
    pub entreprise: Entreprise,
}

#[tauri::command]
pub fn login_offline(
    state: State<AppState>,
    phone: String,
    password: String,
) -> Result<AuthResponse, String> {
    println!("🔐 [LOGIN] Tentative de connexion pour: {}", phone);

    let db = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    // Hasher le mot de passe en SHA1
    let mut hasher = Sha1::new();
    hasher.update(password.as_bytes());
    let hashed_password = format!("{:x}", hasher.finalize());

    println!("🔐 [LOGIN] Password hashé: {}", hashed_password);

    // Récupérer l'utilisateur, son agence et l'entreprise en une seule requête avec jointures
    let result = db.conn.query_row(
        "SELECT
            u.id, u.remote_id, u.us_agence, u.us_type, u.us_code, u.us_nom,
            u.us_email, u.us_phone, u.us_pass, u.us_stat, u.us_photo,
            u.us_device, u.us_printer, u.created_at, u.updated_at,
            a.id, a.remote_id, a.ag_code, a.ag_nom, a.ag_phone, a.ag_pays,
            a.ag_ville, a.ag_devise, a.ag_prefix, a.ag_stat, a.ag_etp,
            a.created_at, a.updated_at,
            e.id, e.remote_id, e.etp_code, e.etp_sender, e.etp_nom, e.etp_mail,
            e.etp_phone, e.etp_pays, e.etp_msgbagage, e.etp_msgcolis, e.etp_pass,
            e.etp_stat, e.etp_img, e.etp_img_local, e.created_at, e.updated_at
         FROM users u
         INNER JOIN agences a ON u.us_agence = a.remote_id
         INNER JOIN entreprises e ON a.ag_etp = e.remote_id
         WHERE u.us_phone = ?1",
        rusqlite::params![phone],
        |row| {
            let user = User {
                id: row.get(0)?,
                remote_id: row.get(1)?,
                us_agence: row.get(2)?,
                us_type: row.get(3)?,
                us_code: row.get(4)?,
                us_nom: row.get(5)?,
                us_email: row.get(6)?,
                us_phone: row.get(7)?,
                us_pass: row.get(8)?,
                us_stat: row.get(9)?,
                us_photo: row.get(10)?,
                us_device: row.get(11)?,
                us_printer: row.get(12)?,
                created_at: row.get(13)?,
                updated_at: row.get(14)?,
            };

            let agence = Agence {
                id: row.get(15)?,
                remote_id: row.get(16)?,
                ag_code: row.get(17)?,
                ag_nom: row.get(18)?,
                ag_phone: row.get(19)?,
                ag_pays: row.get(20)?,
                ag_ville: row.get(21)?,
                ag_devise: row.get(22)?,
                ag_prefix: row.get(23)?,
                ag_stat: row.get(24)?,
                ag_etp: row.get(25)?,
                created_at: row.get(26)?,
                updated_at: row.get(27)?,
            };

            let entreprise = Entreprise {
                id: row.get(28)?,
                remote_id: row.get(29)?,
                etp_code: row.get(30)?,
                etp_sender: row.get(31)?,
                etp_nom: row.get(32)?,
                etp_mail: row.get(33)?,
                etp_phone: row.get(34)?,
                etp_pays: row.get(35)?,
                etp_msgbagage: row.get(36)?,
                etp_msgcolis: row.get(37)?,
                etp_pass: row.get(38)?,
                etp_stat: row.get(39)?,
                etp_img: row.get(40)?,
                etp_img_local: row.get(41)?,
                created_at: row.get(42)?,
                updated_at: row.get(43)?,
            };

            Ok((user, agence, entreprise))
        }
    ).map_err(|e| {
        println!("❌ [LOGIN] Utilisateur non trouvé ou données manquantes: {}", e);
        "Utilisateur non trouvé ou données incomplètes (agence/entreprise manquante)".to_string()
    })?;

    let (user, agence, entreprise) = result;

    println!("✅ [LOGIN] Utilisateur trouvé: {}", user.us_nom);
    println!("✅ [LOGIN] Agence trouvée: {}", agence.ag_nom);
    println!("✅ [LOGIN] Entreprise trouvée: {}", entreprise.etp_nom);
    println!("🔐 [LOGIN] Hash stocké: {:?}", user.us_pass);

    // Vérifier le mot de passe
    if user.us_pass.as_ref().map(|p| p.as_str()) != Some(&hashed_password) {
        println!("❌ [LOGIN] Mot de passe incorrect");
        return Err("Mot de passe incorrect".to_string());
    }

    println!("✅ [LOGIN] Mot de passe correct");
    println!("🎉 [LOGIN] Connexion réussie pour: {}", user.us_nom);

    Ok(AuthResponse {
        user,
        agence,
        entreprise,
    })
}

// ============== STATISTICS ==============

#[derive(serde::Serialize)]
pub struct TicketStats {
    pub count: i64,
    pub total: f64,
}

#[tauri::command]
pub fn get_ticket_statistics(
    state: State<AppState>,
    user_id: i64,
    start_date: String,
    end_date: String,
) -> Result<TicketStats, String> {
    let db = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    let (count, total) = get_ticket_stats(&db.conn, user_id, &start_date, &end_date)
        .map_err(|e| format!("DB error: {}", e))?;

    Ok(TicketStats { count, total })
}

// ============== SYNC TICKETS BY USER ==============

#[tauri::command]
pub async fn sync_tickets_by_user(
    app_handle: tauri::AppHandle,
    user_id: i64,
) -> Result<usize, String> {
    println!("🔄 [SYNC TICKETS] Synchronisation des tickets pour l'utilisateur {}", user_id);

    let client = reqwest::Client::new();

    // Appeler l'API pour récupérer les tickets de l'utilisateur
    let response = client
        .post("https://guichet.createsarl.com/api/ticketbyuser")
        .header("content-type", "application/json")
        .json(&serde_json::json!({ "user": user_id }))
        .send()
        .await
        .map_err(|e| format!("Erreur appel API: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Erreur HTTP: {}", response.status()));
    }

    let json_response: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Erreur parsing JSON: {}", e))?;

    println!("📦 [SYNC TICKETS] Réponse API reçue: status = {:?}", json_response.get("status"));

    // Vérifier le statut de la réponse
    if json_response.get("status").and_then(|s| s.as_i64()) != Some(200) {
        return Err("Réponse API invalide".to_string());
    }

    // Extraire les données des tickets
    let tickets_data = json_response
        .get("data")
        .and_then(|d| d.as_array())
        .ok_or_else(|| "Format de réponse inattendu".to_string())?;

    println!("📊 [SYNC TICKETS] {} tickets à synchroniser", tickets_data.len());

    // Obtenir la connexion à la BD
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Erreur app_data_dir: {}", e))?;
    let db_path = app_dir.join("fast_app.db");

    let conn = rusqlite::Connection::open(&db_path)
        .map_err(|e| format!("Erreur connexion BD: {}", e))?;

    // Synchroniser les tickets
    let count = sync_tickets_from_api(&conn, tickets_data.clone())
        .map_err(|e| format!("Erreur sync tickets: {}", e))?;

    println!("✅ [SYNC TICKETS] {} tickets synchronisés avec succès", count);

    Ok(count)
}
