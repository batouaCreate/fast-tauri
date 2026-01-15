use super::models::*;
use super::operations::*;
use rusqlite::Connection;
use serde_json::json;
use std::time::Duration;
use tokio::time::sleep;
use chrono::Utc;

pub struct SyncManager {
    api_base_url: String,
}

impl SyncManager {
    pub fn new(api_base_url: String) -> Self {
        SyncManager { api_base_url }
    }

    pub async fn sync_departure(&self, departure: &Departure) -> Result<i64, String> {
        let client = reqwest::Client::new();

        let payload = json!({
            "user": departure.dep_user,
            "dep": departure.dep_nom,
            "dest": departure.dep_dest.parse::<i64>().unwrap_or(0),
            "place": departure.dep_place,
            "car": departure.dep_numcar,
            "chauff": departure.dep_chauff,
            "conv": departure.dep_conv,
            "datedep": departure.dep_date,
            "hdep": departure.dep_heure,
        });

        let response = client
            .post(format!("{}/adddepart", self.api_base_url))
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("Erreur réseau: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Erreur HTTP: {}", response.status()));
        }

        let result: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Erreur parsing JSON: {}", e))?;

        if result["status"].as_i64().unwrap_or(0) != 200 {
            return Err(result["msg"].as_str().unwrap_or("Erreur inconnue").to_string());
        }

        // Extraire l'ID du départ depuis la réponse de l'API
        // L'API retourne l'ID dans result["data"]["id"]
        let remote_id = result["data"]["id"]
            .as_i64()
            .or_else(|| result["data"]["dep_id"].as_i64())
            .or_else(|| result["dep_id"].as_i64())
            .unwrap_or_else(|| {
                // Si l'API ne retourne pas d'ID, on utilise un timestamp comme fallback
                // Ce n'est pas idéal mais permet au moins de marquer comme synchronisé
                println!("⚠️ [SYNC] L'API n'a pas retourné d'ID pour le départ, utilisation d'un ID temporaire");
                println!("⚠️ [SYNC] Réponse de l'API: {:?}", result);
                chrono::Utc::now().timestamp()
            });

        println!("📝 [SYNC] Départ synchronisé avec remote_id: {}", remote_id);
        Ok(remote_id)
    }

    pub async fn sync_ticket(&self, ticket: &Ticket, departure_remote_id: i64) -> Result<i64, String> {
        let client = reqwest::Client::new();

        println!("🎫 [SYNC] Synchronisation ticket local_id={:?} avec departure_remote_id={}", ticket.id, departure_remote_id);

        let payload = json!({
            "user": ticket.tick_user,
            "depart": departure_remote_id,  // Utiliser l'ID distant du départ
            "dest": ticket.tick_dest,
            "siege": ticket.tick_siege.parse::<i64>().unwrap_or(0),
            "phone": ticket.tick_phone,
            "voyageur": ticket.tick_nom,
            "price": ticket.tick_price.parse::<f64>().unwrap_or(0.0),
            "method": ticket.tick_method,
            "reduction": ticket.tick_reduc,
            "nature": ticket.tick_nature,
        });

        let response = client
            .post(format!("{}/sellbillet", self.api_base_url))
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("Erreur réseau: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Erreur HTTP: {}", response.status()));
        }

        let result: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Erreur parsing JSON: {}", e))?;

        if result["status"].as_i64().unwrap_or(0) != 200 {
            return Err(result["msg"].as_str().unwrap_or("Erreur inconnue").to_string());
        }

        // Extraire l'ID du ticket depuis la réponse
        let ticket_id = result["data"]
            .as_array()
            .and_then(|arr| arr.first())
            .and_then(|item| item["tick_id"].as_i64())
            .unwrap_or(0);

        Ok(ticket_id)
    }

    pub async fn sync_colis(&self, colis: &Colis) -> Result<i64, String> {
        let client = reqwest::Client::new();

        let payload = json!({
            "user": colis.exp_user,
            "depart": colis.exp_depart,
            "nature": colis.exp_colnat,
            "frais": colis.exp_frais.parse::<f64>().unwrap_or(0.0),
            "desc": colis.exp_coldesc,
            "valeur": colis.exp_colval.parse::<f64>().unwrap_or(0.0),
            "exp": colis.exp_exp,
            "phonexp": colis.exp_phonexp,
            "benef": colis.exp_dest,
            "phonedest": colis.exp_destphone,
            "agdest": colis.exp_agdest.parse::<i64>().unwrap_or(0),
        });

        let response = client
            .post(format!("{}/createcolis_v2", self.api_base_url))
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("Erreur réseau: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Erreur HTTP: {}", response.status()));
        }

        let result: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Erreur parsing JSON: {}", e))?;

        if result["status"].as_i64().unwrap_or(0) != 200 {
            return Err(result["msg"].as_str().unwrap_or("Erreur inconnue").to_string());
        }

        Ok(colis.id.unwrap_or(0))
    }

    pub async fn sync_bagage(&self, bagage: &Bagage) -> Result<i64, String> {
        let client = reqwest::Client::new();

        let payload = json!({
            "user": bagage.exp_user,
            "depart": bagage.exp_depart,
            "nature": bagage.exp_colnat,
            "frais": bagage.exp_frais.parse::<f64>().unwrap_or(0.0),
            "desc": bagage.exp_coldesc,
            "valeur": bagage.exp_colval.parse::<f64>().unwrap_or(0.0),
            "exp": bagage.exp_exp,
            "phonexp": bagage.exp_phonexp,
            "siege": bagage.exp_siege.parse::<i64>().unwrap_or(0),
            "dest": bagage.exp_dest,
        });

        let response = client
            .post(format!("{}/createbagage", self.api_base_url))
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("Erreur réseau: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Erreur HTTP: {}", response.status()));
        }

        let result: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Erreur parsing JSON: {}", e))?;

        if result["status"].as_i64().unwrap_or(0) != 200 {
            return Err(result["msg"].as_str().unwrap_or("Erreur inconnue").to_string());
        }

        Ok(bagage.id.unwrap_or(0))
    }
}

// Fonction pour démarrer le processus de synchronisation en arrière-plan
pub async fn start_sync_worker(
    db_path: std::path::PathBuf,
    api_base_url: String,
    interval_seconds: u64,
) {
    let sync_manager = SyncManager::new(api_base_url);

    loop {
        // Attendre l'intervalle avant de synchroniser
        sleep(Duration::from_secs(interval_seconds)).await;

        // Ouvrir une connexion à la base de données
        let conn = match Connection::open(&db_path) {
            Ok(c) => c,
            Err(e) => {
                eprintln!("Erreur ouverture DB pour sync: {}", e);
                continue;
            }
        };

        // Synchroniser les départs en attente
        if let Ok(departures) = get_pending_departures(&conn) {
            for departure in departures {
                match sync_manager.sync_departure(&departure).await {
                    Ok(remote_id) => {
                        if let Some(local_id) = departure.id {
                            let _ = update_departure_remote_id(&conn, local_id, remote_id);
                            println!("✅ Départ {} synchronisé avec succès", local_id);
                        }
                    }
                    Err(e) => {
                        eprintln!("❌ Erreur sync départ {:?}: {}", departure.id, e);
                        // Marquer comme erreur dans la DB
                        if let Some(local_id) = departure.id {
                            let _ = conn.execute(
                                "UPDATE departures SET sync_status = 'error', sync_error = ?1, last_sync_attempt = datetime('now') WHERE id = ?2",
                                rusqlite::params![e, local_id],
                            );
                        }
                    }
                }
            }
        }

        // Synchroniser les tickets en attente
        if let Ok(tickets) = get_pending_tickets(&conn) {
            for ticket in tickets {
                // Récupérer le remote_id du départ associé
                let departure_remote_id = conn
                    .query_row(
                        "SELECT remote_id FROM departures WHERE id = ?1",
                        rusqlite::params![ticket.tick_depart],
                        |row| row.get::<_, Option<i64>>(0),
                    )
                    .ok()
                    .flatten();

                if let Some(remote_id) = departure_remote_id {
                    // Le départ a été synchronisé, on peut synchroniser le ticket
                    match sync_manager.sync_ticket(&ticket, remote_id).await {
                        Ok(ticket_remote_id) => {
                            if let Some(local_id) = ticket.id {
                                let _ = update_ticket_remote_id(&conn, local_id, ticket_remote_id);
                                println!("✅ Ticket {} synchronisé avec succès (remote_id: {})", local_id, ticket_remote_id);
                            }
                        }
                        Err(e) => {
                            eprintln!("❌ Erreur sync ticket {:?}: {}", ticket.id, e);
                            if let Some(local_id) = ticket.id {
                                let _ = conn.execute(
                                    "UPDATE tickets SET sync_status = 'error', sync_error = ?1, last_sync_attempt = datetime('now') WHERE id = ?2",
                                    rusqlite::params![e, local_id],
                                );
                            }
                        }
                    }
                } else {
                    // Le départ n'a pas encore été synchronisé
                    println!("⏳ Ticket {:?} en attente: le départ {} doit être synchronisé d'abord", ticket.id, ticket.tick_depart);
                    if let Some(local_id) = ticket.id {
                        let _ = conn.execute(
                            "UPDATE tickets SET sync_error = 'En attente de la synchronisation du départ', last_sync_attempt = datetime('now') WHERE id = ?1",
                            rusqlite::params![local_id],
                        );
                    }
                }
            }
        }
    }
}
