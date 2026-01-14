use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SyncStatus {
    Pending,
    Synced,
    Error,
}

impl SyncStatus {
    pub fn as_str(&self) -> &str {
        match self {
            SyncStatus::Pending => "pending",
            SyncStatus::Synced => "synced",
            SyncStatus::Error => "error",
        }
    }

    pub fn from_str(s: &str) -> Self {
        match s {
            "synced" => SyncStatus::Synced,
            "error" => SyncStatus::Error,
            _ => SyncStatus::Pending,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Departure {
    pub id: Option<i64>,
    pub remote_id: Option<i64>,
    pub dep_ligne: Option<String>,
    pub dep_user: i64,
    pub dep_numcar: String,
    pub dep_nom: String,
    pub dep_dest: String,
    pub dep_place: i64,
    pub dep_chauff: String,
    pub dep_conv: String,
    pub dep_date: String,
    pub dep_heure: String,
    pub dep_fraisroute: f64,
    pub dep_lavage: f64,
    pub dep_carbur: f64,
    pub dep_droitgare: f64,
    pub dep_autredep: f64,
    pub ag_id: i64,
    pub created_at: String,
    pub updated_at: String,
    pub sync_status: String,
    pub last_sync_attempt: Option<String>,
    pub sync_error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Ticket {
    pub id: Option<i64>,
    pub remote_id: Option<i64>,
    pub tick_vtick: Option<i64>,
    pub tick_user: i64,
    pub tick_depart: i64,
    pub tick_price: String,
    pub tick_reduc: f64,
    pub tick_dest: i64,
    pub tick_nom: String,
    pub tick_phone: Option<String>,
    pub tick_siege: String,
    pub tick_nature: String,
    pub tick_method: String,
    pub tick_type: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub sync_status: String,
    pub last_sync_attempt: Option<String>,
    pub sync_error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Colis {
    pub id: Option<i64>,
    pub remote_id: Option<i64>,
    pub exp_user: i64,
    pub exp_type: String,
    pub exp_depart: i64,
    pub exp_bord: Option<String>,
    pub exp_numcar: String,
    pub exp_colnat: String,
    pub exp_colval: String,
    pub exp_frais: String,
    pub exp_stat: i64,
    pub exp_coldesc: String,
    pub exp_code: Option<String>,
    pub exp_exp: String,
    pub exp_phonexp: String,
    pub exp_dest: String,
    pub exp_destphone: String,
    pub exp_agdest: String,
    pub exp_siege: Option<String>,
    pub exp_img: Option<String>,
    pub exp_imgret: Option<String>,
    pub exp_destdevice: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub sync_status: String,
    pub last_sync_attempt: Option<String>,
    pub sync_error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bagage {
    pub id: Option<i64>,
    pub remote_id: Option<i64>,
    pub exp_user: i64,
    pub exp_type: String,
    pub exp_depart: i64,
    pub exp_bord: Option<String>,
    pub exp_numcar: String,
    pub exp_colnat: String,
    pub exp_colval: String,
    pub exp_frais: String,
    pub exp_stat: i64,
    pub exp_coldesc: String,
    pub exp_code: Option<String>,
    pub exp_exp: String,
    pub exp_phonexp: String,
    pub exp_dest: i64,
    pub exp_siege: String,
    pub exp_img: Option<String>,
    pub exp_imgret: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub sync_status: String,
    pub last_sync_attempt: Option<String>,
    pub sync_error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agence {
    pub id: Option<i64>,
    pub remote_id: Option<i64>,
    pub ag_code: Option<String>,
    pub ag_nom: String,
    pub ag_phone: Option<String>,
    pub ag_pays: Option<String>,
    pub ag_ville: Option<String>,
    pub ag_devise: Option<String>,
    pub ag_prefix: Option<String>,
    pub ag_stat: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Destination {
    pub id: Option<i64>,
    pub remote_id: Option<i64>,
    pub dest_user: i64,
    pub dest_agence: i64,
    pub dest_ville: String,
    pub dest_price: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncQueueItem {
    pub id: Option<i64>,
    pub entity_type: String,
    pub entity_id: i64,
    pub operation: String,
    pub payload: String,
    pub created_at: String,
    pub retry_count: i64,
    pub last_error: Option<String>,
}

// DTOs pour les requêtes de création
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateDepartureRequest {
    pub user: i64,
    pub dep: String,
    pub dest: i64,
    pub place: i64,
    pub car: String,
    pub chauff: String,
    pub conv: String,
    pub datedep: String,
    pub hdep: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SellTicketRequest {
    pub user: i64,
    pub depart: i64,
    pub dest: i64,
    pub siege: i64,
    pub phone: String,
    pub voyageur: String,
    pub price: f64,
    pub method: String,
    pub reduction: f64,
    pub nature: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateColisRequest {
    pub user: i64,
    pub depart: i64,
    pub nature: String,
    pub frais: f64,
    pub desc: String,
    pub valeur: f64,
    pub exp: String,
    pub phonexp: String,
    pub benef: String,
    pub phonedest: String,
    pub agdest: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateBagageRequest {
    pub user: i64,
    pub depart: i64,
    pub nature: String,
    pub frais: f64,
    pub desc: String,
    pub valeur: f64,
    pub exp: String,
    pub phonexp: String,
    pub siege: i64,
    pub dest: i64,
}
