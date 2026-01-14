use crate::db::{models::*, operations::*, Database};
use crate::db::operations::{sync_agences_from_api, get_all_agences, sync_destinations_from_api, get_all_destinations, get_destinations_by_agence, sync_departures_from_api};
use tauri::State;
use std::sync::Mutex;

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

    let info = format!(
        "📊 Statistiques BD:\n\
         - Agences: {}\n\
         - Destinations: {}\n\
         - Départs: {}\n\
         - Tickets: {}",
        count_agences, count_destinations, count_departures, count_tickets
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
