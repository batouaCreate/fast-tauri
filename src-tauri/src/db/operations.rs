use super::models::*;
use rusqlite::{params, Connection, Result};
use chrono::Utc;

// ============== DEPARTURES ==============

pub fn create_departure(conn: &Connection, req: &CreateDepartureRequest, ag_id: i64) -> Result<Departure> {
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO departures (
            dep_user, dep_numcar, dep_nom, dep_dest, dep_place,
            dep_chauff, dep_conv, dep_date, dep_heure, ag_id,
            created_at, updated_at, sync_status
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        params![
            req.user,
            req.car,
            req.dep,
            req.dest,
            req.place,
            req.chauff,
            req.conv,
            req.datedep,
            req.hdep,
            ag_id,
            now,
            now,
            "pending"
        ],
    )?;

    let id = conn.last_insert_rowid();
    get_departure_by_id(conn, id)
}

pub fn get_departure_by_id(conn: &Connection, id: i64) -> Result<Departure> {
    conn.query_row(
        "SELECT id, remote_id, dep_ligne, dep_user, dep_numcar, dep_nom, dep_dest,
                dep_place, dep_chauff, dep_conv, dep_date, dep_heure,
                dep_fraisroute, dep_lavage, dep_carbur, dep_droitgare, dep_autredep,
                ag_id, created_at, updated_at, sync_status, last_sync_attempt, sync_error
         FROM departures WHERE id = ?1",
        params![id],
        |row| {
            Ok(Departure {
                id: row.get(0)?,
                remote_id: row.get(1)?,
                dep_ligne: row.get(2)?,
                dep_user: row.get(3)?,
                dep_numcar: row.get(4)?,
                dep_nom: row.get(5)?,
                dep_dest: row.get(6)?,
                dep_place: row.get(7)?,
                dep_chauff: row.get(8)?,
                dep_conv: row.get(9)?,
                dep_date: row.get(10)?,
                dep_heure: row.get(11)?,
                dep_fraisroute: row.get(12)?,
                dep_lavage: row.get(13)?,
                dep_carbur: row.get(14)?,
                dep_droitgare: row.get(15)?,
                dep_autredep: row.get(16)?,
                ag_id: row.get(17)?,
                created_at: row.get(18)?,
                updated_at: row.get(19)?,
                sync_status: row.get(20)?,
                last_sync_attempt: row.get(21)?,
                sync_error: row.get(22)?,
            })
        },
    )
}

pub fn get_all_departures(conn: &Connection, user_id: i64) -> Result<Vec<Departure>> {
    let mut stmt = conn.prepare(
        "SELECT id, remote_id, dep_ligne, dep_user, dep_numcar, dep_nom, dep_dest,
                dep_place, dep_chauff, dep_conv, dep_date, dep_heure,
                dep_fraisroute, dep_lavage, dep_carbur, dep_droitgare, dep_autredep,
                ag_id, created_at, updated_at, sync_status, last_sync_attempt, sync_error
         FROM departures WHERE dep_user = ?1
         ORDER BY dep_date DESC, dep_heure DESC"
    )?;

    let departures = stmt.query_map(params![user_id], |row| {
        Ok(Departure {
            id: row.get(0)?,
            remote_id: row.get(1)?,
            dep_ligne: row.get(2)?,
            dep_user: row.get(3)?,
            dep_numcar: row.get(4)?,
            dep_nom: row.get(5)?,
            dep_dest: row.get(6)?,
            dep_place: row.get(7)?,
            dep_chauff: row.get(8)?,
            dep_conv: row.get(9)?,
            dep_date: row.get(10)?,
            dep_heure: row.get(11)?,
            dep_fraisroute: row.get(12)?,
            dep_lavage: row.get(13)?,
            dep_carbur: row.get(14)?,
            dep_droitgare: row.get(15)?,
            dep_autredep: row.get(16)?,
            ag_id: row.get(17)?,
            created_at: row.get(18)?,
            updated_at: row.get(19)?,
            sync_status: row.get(20)?,
            last_sync_attempt: row.get(21)?,
            sync_error: row.get(22)?,
        })
    })?;

    departures.collect()
}

pub fn update_departure_remote_id(conn: &Connection, local_id: i64, remote_id: i64) -> Result<()> {
    conn.execute(
        "UPDATE departures SET remote_id = ?1, sync_status = 'synced', updated_at = ?2 WHERE id = ?3",
        params![remote_id, Utc::now().to_rfc3339(), local_id],
    )?;
    Ok(())
}

pub fn get_pending_departures(conn: &Connection) -> Result<Vec<Departure>> {
    let mut stmt = conn.prepare(
        "SELECT id, remote_id, dep_ligne, dep_user, dep_numcar, dep_nom, dep_dest,
                dep_place, dep_chauff, dep_conv, dep_date, dep_heure,
                dep_fraisroute, dep_lavage, dep_carbur, dep_droitgare, dep_autredep,
                ag_id, created_at, updated_at, sync_status, last_sync_attempt, sync_error
         FROM departures WHERE sync_status = 'pending' ORDER BY created_at ASC"
    )?;

    let departures = stmt.query_map([], |row| {
        Ok(Departure {
            id: row.get(0)?,
            remote_id: row.get(1)?,
            dep_ligne: row.get(2)?,
            dep_user: row.get(3)?,
            dep_numcar: row.get(4)?,
            dep_nom: row.get(5)?,
            dep_dest: row.get(6)?,
            dep_place: row.get(7)?,
            dep_chauff: row.get(8)?,
            dep_conv: row.get(9)?,
            dep_date: row.get(10)?,
            dep_heure: row.get(11)?,
            dep_fraisroute: row.get(12)?,
            dep_lavage: row.get(13)?,
            dep_carbur: row.get(14)?,
            dep_droitgare: row.get(15)?,
            dep_autredep: row.get(16)?,
            ag_id: row.get(17)?,
            created_at: row.get(18)?,
            updated_at: row.get(19)?,
            sync_status: row.get(20)?,
            last_sync_attempt: row.get(21)?,
            sync_error: row.get(22)?,
        })
    })?;

    departures.collect()
}

// ============== TICKETS ==============

pub fn create_ticket(conn: &Connection, req: &SellTicketRequest) -> Result<Ticket> {
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO tickets (
            tick_user, tick_depart, tick_price, tick_reduc, tick_dest,
            tick_nom, tick_phone, tick_siege, tick_nature, tick_method,
            created_at, updated_at, sync_status
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        params![
            req.user,
            req.depart,
            req.price.to_string(),
            req.reduction,
            req.dest,
            req.voyageur,
            req.phone,
            req.siege.to_string(),
            req.nature,
            req.method,
            now,
            now,
            "pending"
        ],
    )?;

    let id = conn.last_insert_rowid();
    get_ticket_by_id(conn, id)
}

pub fn get_ticket_by_id(conn: &Connection, id: i64) -> Result<Ticket> {
    conn.query_row(
        "SELECT id, remote_id, tick_vtick, tick_user, tick_depart, tick_price,
                tick_reduc, tick_dest, tick_nom, tick_phone, tick_siege,
                tick_nature, tick_method, tick_type,
                created_at, updated_at, sync_status, last_sync_attempt, sync_error
         FROM tickets WHERE id = ?1",
        params![id],
        |row| {
            Ok(Ticket {
                id: row.get(0)?,
                remote_id: row.get(1)?,
                tick_vtick: row.get(2)?,
                tick_user: row.get(3)?,
                tick_depart: row.get(4)?,
                tick_price: row.get(5)?,
                tick_reduc: row.get(6)?,
                tick_dest: row.get(7)?,
                tick_nom: row.get(8)?,
                tick_phone: row.get(9)?,
                tick_siege: row.get(10)?,
                tick_nature: row.get(11)?,
                tick_method: row.get(12)?,
                tick_type: row.get(13)?,
                created_at: row.get(14)?,
                updated_at: row.get(15)?,
                sync_status: row.get(16)?,
                last_sync_attempt: row.get(17)?,
                sync_error: row.get(18)?,
            })
        },
    )
}

pub fn get_all_tickets(conn: &Connection, user_id: i64) -> Result<Vec<Ticket>> {
    let mut stmt = conn.prepare(
        "SELECT id, remote_id, tick_vtick, tick_user, tick_depart, tick_price,
                tick_reduc, tick_dest, tick_nom, tick_phone, tick_siege,
                tick_nature, tick_method, tick_type,
                created_at, updated_at, sync_status, last_sync_attempt, sync_error
         FROM tickets WHERE tick_user = ?1
         ORDER BY created_at DESC"
    )?;

    let tickets = stmt.query_map(params![user_id], |row| {
        Ok(Ticket {
            id: row.get(0)?,
            remote_id: row.get(1)?,
            tick_vtick: row.get(2)?,
            tick_user: row.get(3)?,
            tick_depart: row.get(4)?,
            tick_price: row.get(5)?,
            tick_reduc: row.get(6)?,
            tick_dest: row.get(7)?,
            tick_nom: row.get(8)?,
            tick_phone: row.get(9)?,
            tick_siege: row.get(10)?,
            tick_nature: row.get(11)?,
            tick_method: row.get(12)?,
            tick_type: row.get(13)?,
            created_at: row.get(14)?,
            updated_at: row.get(15)?,
            sync_status: row.get(16)?,
            last_sync_attempt: row.get(17)?,
            sync_error: row.get(18)?,
        })
    })?;

    tickets.collect()
}

pub fn get_tickets_by_departure(conn: &Connection, departure_id: i64) -> Result<Vec<Ticket>> {
    let mut stmt = conn.prepare(
        "SELECT id, remote_id, tick_vtick, tick_user, tick_depart, tick_price,
                tick_reduc, tick_dest, tick_nom, tick_phone, tick_siege,
                tick_nature, tick_method, tick_type,
                created_at, updated_at, sync_status, last_sync_attempt, sync_error
         FROM tickets WHERE tick_depart = ?1
         ORDER BY created_at DESC"
    )?;

    let tickets = stmt.query_map(params![departure_id], |row| {
        Ok(Ticket {
            id: row.get(0)?,
            remote_id: row.get(1)?,
            tick_vtick: row.get(2)?,
            tick_user: row.get(3)?,
            tick_depart: row.get(4)?,
            tick_price: row.get(5)?,
            tick_reduc: row.get(6)?,
            tick_dest: row.get(7)?,
            tick_nom: row.get(8)?,
            tick_phone: row.get(9)?,
            tick_siege: row.get(10)?,
            tick_nature: row.get(11)?,
            tick_method: row.get(12)?,
            tick_type: row.get(13)?,
            created_at: row.get(14)?,
            updated_at: row.get(15)?,
            sync_status: row.get(16)?,
            last_sync_attempt: row.get(17)?,
            sync_error: row.get(18)?,
        })
    })?;

    tickets.collect()
}

pub fn update_ticket_remote_id(conn: &Connection, local_id: i64, remote_id: i64) -> Result<()> {
    conn.execute(
        "UPDATE tickets SET remote_id = ?1, sync_status = 'synced', updated_at = ?2 WHERE id = ?3",
        params![remote_id, Utc::now().to_rfc3339(), local_id],
    )?;
    Ok(())
}

pub fn get_pending_tickets(conn: &Connection) -> Result<Vec<Ticket>> {
    let mut stmt = conn.prepare(
        "SELECT id, remote_id, tick_vtick, tick_user, tick_depart, tick_price,
                tick_reduc, tick_dest, tick_nom, tick_phone, tick_siege,
                tick_nature, tick_method, tick_type,
                created_at, updated_at, sync_status, last_sync_attempt, sync_error
         FROM tickets WHERE sync_status = 'pending' ORDER BY created_at ASC"
    )?;

    let tickets = stmt.query_map([], |row| {
        Ok(Ticket {
            id: row.get(0)?,
            remote_id: row.get(1)?,
            tick_vtick: row.get(2)?,
            tick_user: row.get(3)?,
            tick_depart: row.get(4)?,
            tick_price: row.get(5)?,
            tick_reduc: row.get(6)?,
            tick_dest: row.get(7)?,
            tick_nom: row.get(8)?,
            tick_phone: row.get(9)?,
            tick_siege: row.get(10)?,
            tick_nature: row.get(11)?,
            tick_method: row.get(12)?,
            tick_type: row.get(13)?,
            created_at: row.get(14)?,
            updated_at: row.get(15)?,
            sync_status: row.get(16)?,
            last_sync_attempt: row.get(17)?,
            sync_error: row.get(18)?,
        })
    })?;

    tickets.collect()
}

// ============== COLIS ==============

pub fn create_colis(conn: &Connection, req: &CreateColisRequest, numcar: &str) -> Result<Colis> {
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO colis (
            exp_user, exp_depart, exp_numcar, exp_colnat, exp_colval, exp_frais,
            exp_coldesc, exp_exp, exp_phonexp, exp_dest, exp_destphone, exp_agdest,
            created_at, updated_at, sync_status
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)",
        params![
            req.user,
            req.depart,
            numcar,
            req.nature,
            req.valeur.to_string(),
            req.frais.to_string(),
            req.desc,
            req.exp,
            req.phonexp,
            req.benef,
            req.phonedest,
            req.agdest.to_string(),
            now,
            now,
            "pending"
        ],
    )?;

    let id = conn.last_insert_rowid();
    get_colis_by_id(conn, id)
}

pub fn get_colis_by_id(conn: &Connection, id: i64) -> Result<Colis> {
    conn.query_row(
        "SELECT id, remote_id, exp_user, exp_type, exp_depart, exp_bord, exp_numcar,
                exp_colnat, exp_colval, exp_frais, exp_stat, exp_coldesc, exp_code,
                exp_exp, exp_phonexp, exp_dest, exp_destphone, exp_agdest, exp_siege,
                exp_img, exp_imgret, exp_destdevice,
                created_at, updated_at, sync_status, last_sync_attempt, sync_error
         FROM colis WHERE id = ?1",
        params![id],
        |row| {
            Ok(Colis {
                id: row.get(0)?,
                remote_id: row.get(1)?,
                exp_user: row.get(2)?,
                exp_type: row.get(3)?,
                exp_depart: row.get(4)?,
                exp_bord: row.get(5)?,
                exp_numcar: row.get(6)?,
                exp_colnat: row.get(7)?,
                exp_colval: row.get(8)?,
                exp_frais: row.get(9)?,
                exp_stat: row.get(10)?,
                exp_coldesc: row.get(11)?,
                exp_code: row.get(12)?,
                exp_exp: row.get(13)?,
                exp_phonexp: row.get(14)?,
                exp_dest: row.get(15)?,
                exp_destphone: row.get(16)?,
                exp_agdest: row.get(17)?,
                exp_siege: row.get(18)?,
                exp_img: row.get(19)?,
                exp_imgret: row.get(20)?,
                exp_destdevice: row.get(21)?,
                created_at: row.get(22)?,
                updated_at: row.get(23)?,
                sync_status: row.get(24)?,
                last_sync_attempt: row.get(25)?,
                sync_error: row.get(26)?,
            })
        },
    )
}

// ============== BAGAGES ==============

pub fn create_bagage(conn: &Connection, req: &CreateBagageRequest, numcar: &str) -> Result<Bagage> {
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO bagages (
            exp_user, exp_depart, exp_numcar, exp_colnat, exp_colval, exp_frais,
            exp_coldesc, exp_exp, exp_phonexp, exp_dest, exp_siege,
            created_at, updated_at, sync_status
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
        params![
            req.user,
            req.depart,
            numcar,
            req.nature,
            req.valeur.to_string(),
            req.frais.to_string(),
            req.desc,
            req.exp,
            req.phonexp,
            req.dest,
            req.siege.to_string(),
            now,
            now,
            "pending"
        ],
    )?;

    let id = conn.last_insert_rowid();
    get_bagage_by_id(conn, id)
}

pub fn get_bagage_by_id(conn: &Connection, id: i64) -> Result<Bagage> {
    conn.query_row(
        "SELECT id, remote_id, exp_user, exp_type, exp_depart, exp_bord, exp_numcar,
                exp_colnat, exp_colval, exp_frais, exp_stat, exp_coldesc, exp_code,
                exp_exp, exp_phonexp, exp_dest, exp_siege, exp_img, exp_imgret,
                created_at, updated_at, sync_status, last_sync_attempt, sync_error
         FROM bagages WHERE id = ?1",
        params![id],
        |row| {
            Ok(Bagage {
                id: row.get(0)?,
                remote_id: row.get(1)?,
                exp_user: row.get(2)?,
                exp_type: row.get(3)?,
                exp_depart: row.get(4)?,
                exp_bord: row.get(5)?,
                exp_numcar: row.get(6)?,
                exp_colnat: row.get(7)?,
                exp_colval: row.get(8)?,
                exp_frais: row.get(9)?,
                exp_stat: row.get(10)?,
                exp_coldesc: row.get(11)?,
                exp_code: row.get(12)?,
                exp_exp: row.get(13)?,
                exp_phonexp: row.get(14)?,
                exp_dest: row.get(15)?,
                exp_siege: row.get(16)?,
                exp_img: row.get(17)?,
                exp_imgret: row.get(18)?,
                created_at: row.get(19)?,
                updated_at: row.get(20)?,
                sync_status: row.get(21)?,
                last_sync_attempt: row.get(22)?,
                sync_error: row.get(23)?,
            })
        },
    )
}

// ============== AGENCES ==============

pub fn sync_agences_from_api(conn: &Connection, agences_data: Vec<serde_json::Value>) -> Result<usize> {
    let now = chrono::Utc::now().to_rfc3339();
    let mut count = 0;

    for agence in agences_data {
        let remote_id = agence["ag_id"].as_i64().unwrap_or(0);

        // Utiliser INSERT OR REPLACE pour éviter les doublons
        conn.execute(
            "INSERT OR REPLACE INTO agences (
                remote_id, ag_code, ag_nom, ag_phone, ag_pays, ag_ville,
                ag_devise, ag_prefix, ag_stat, ag_etp, created_at, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10,
                COALESCE((SELECT created_at FROM agences WHERE remote_id = ?1), ?11),
                ?12
            )",
            params![
                remote_id,
                agence["ag_code"].as_str(),
                agence["ag_nom"].as_str().unwrap_or(""),
                agence["ag_phone"].as_str(),
                agence["ag_pays"].as_str(),
                agence["ag_ville"].as_str(),
                agence["ag_devise"].as_str(),
                agence["ag_prefix"].as_str(),
                agence["ag_stat"].as_str(),
                agence["ag_etp"].as_i64(),
                now,
                now,
            ],
        )?;
        count += 1;
    }

    Ok(count)
}

pub fn get_all_agences(conn: &Connection) -> Result<Vec<Agence>> {
    let mut stmt = conn.prepare(
        "SELECT id, remote_id, ag_code, ag_nom, ag_phone, ag_pays, ag_ville,
                ag_devise, ag_prefix, ag_stat, ag_etp, created_at, updated_at
         FROM agences
         ORDER BY ag_nom ASC"
    )?;

    let agences = stmt.query_map([], |row| {
        Ok(Agence {
            id: row.get(0)?,
            remote_id: row.get(1)?,
            ag_code: row.get(2)?,
            ag_nom: row.get(3)?,
            ag_phone: row.get(4)?,
            ag_pays: row.get(5)?,
            ag_ville: row.get(6)?,
            ag_devise: row.get(7)?,
            ag_prefix: row.get(8)?,
            ag_stat: row.get(9)?,
            ag_etp: row.get(10)?,
            created_at: row.get(11)?,
            updated_at: row.get(12)?,
        })
    })?;

    agences.collect()
}

// ============== DESTINATIONS ==============

pub fn sync_destinations_from_api(conn: &Connection, destinations_data: Vec<serde_json::Value>) -> Result<usize> {
    let now = chrono::Utc::now().to_rfc3339();
    let mut count = 0;

    for dest in destinations_data {
        let remote_id = dest["dest_id"].as_i64().unwrap_or(0);

        // Utiliser INSERT OR REPLACE pour éviter les doublons
        conn.execute(
            "INSERT OR REPLACE INTO destinations (
                remote_id, dest_user, dest_agence, dest_ville, dest_price,
                created_at, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5,
                COALESCE((SELECT created_at FROM destinations WHERE remote_id = ?1), ?6),
                ?7
            )",
            params![
                remote_id,
                dest["dest_user"].as_i64().unwrap_or(0),
                dest["dest_agence"].as_i64().unwrap_or(0),
                dest["dest_ville"].as_str().unwrap_or(""),
                dest["dest_price"].as_str().unwrap_or("0"),
                now,
                now,
            ],
        )?;
        count += 1;
    }

    Ok(count)
}

pub fn get_all_destinations(conn: &Connection) -> Result<Vec<Destination>> {
    let mut stmt = conn.prepare(
        "SELECT id, remote_id, dest_user, dest_agence, dest_ville, dest_price,
                created_at, updated_at
         FROM destinations
         ORDER BY dest_ville ASC"
    )?;

    let destinations = stmt.query_map([], |row| {
        Ok(Destination {
            id: row.get(0)?,
            remote_id: row.get(1)?,
            dest_user: row.get(2)?,
            dest_agence: row.get(3)?,
            dest_ville: row.get(4)?,
            dest_price: row.get(5)?,
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
        })
    })?;

    destinations.collect()
}

pub fn get_destinations_by_agence(conn: &Connection, agence_id: i64) -> Result<Vec<Destination>> {
    let mut stmt = conn.prepare(
        "SELECT id, remote_id, dest_user, dest_agence, dest_ville, dest_price,
                created_at, updated_at
         FROM destinations
         WHERE dest_agence = ?1
         ORDER BY dest_ville ASC"
    )?;

    let destinations = stmt.query_map(params![agence_id], |row| {
        Ok(Destination {
            id: row.get(0)?,
            remote_id: row.get(1)?,
            dest_user: row.get(2)?,
            dest_agence: row.get(3)?,
            dest_ville: row.get(4)?,
            dest_price: row.get(5)?,
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
        })
    })?;

    destinations.collect()
}

// Synchroniser les départs depuis l'API
pub fn sync_departures_from_api(conn: &Connection, departures_data: Vec<serde_json::Value>) -> Result<usize> {
    let now = chrono::Utc::now().to_rfc3339();
    let mut count = 0;

    for dep in departures_data {
        let remote_id = dep["dep_id"].as_i64().unwrap_or(0);

        // Vérifier si un départ avec ce remote_id existe déjà
        let exists: bool = conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM departures WHERE remote_id = ?1)",
            params![remote_id],
            |row| row.get(0),
        ).unwrap_or(false);

        if exists {
            // Mettre à jour le départ existant
            println!("🔄 [SYNC] Mise à jour du départ existant avec remote_id: {}", remote_id);
            conn.execute(
                "UPDATE departures SET
                    dep_ligne = ?1,
                    dep_user = ?2,
                    dep_numcar = ?3,
                    dep_nom = ?4,
                    dep_dest = ?5,
                    dep_place = ?6,
                    dep_chauff = ?7,
                    dep_conv = ?8,
                    dep_date = ?9,
                    dep_heure = ?10,
                    dep_fraisroute = ?11,
                    dep_lavage = ?12,
                    dep_carbur = ?13,
                    dep_droitgare = ?14,
                    dep_autredep = ?15,
                    ag_id = ?16,
                    sync_status = ?17,
                    updated_at = ?18
                WHERE remote_id = ?19",
                params![
                    dep["dep_ligne"].as_str(),
                    dep["dep_user"].as_i64().unwrap_or(0),
                    dep["dep_numcar"].as_str().unwrap_or(""),
                    dep["dep_nom"].as_str().unwrap_or(""),
                    dep["dep_dest"].as_str().unwrap_or(""),
                    dep["dep_place"].as_i64().unwrap_or(0),
                    dep["dep_chauff"].as_str().unwrap_or(""),
                    dep["dep_conv"].as_str().unwrap_or(""),
                    dep["dep_date"].as_str().unwrap_or(""),
                    dep["dep_heure"].as_str().unwrap_or(""),
                    dep["dep_fraisroute"].as_i64().unwrap_or(0),
                    dep["dep_lavage"].as_i64().unwrap_or(0),
                    dep["dep_carbur"].as_i64().unwrap_or(0),
                    dep["dep_droitgare"].as_i64().unwrap_or(0),
                    dep["dep_autredep"].as_i64().unwrap_or(0),
                    dep["ag_id"].as_i64().unwrap_or(0),
                    "synced",  // Les départs provenant de l'API sont déjà synchronisés
                    now,
                    remote_id,
                ],
            )?;
        } else {
            // Insérer un nouveau départ
            println!("➕ [SYNC] Insertion d'un nouveau départ avec remote_id: {}", remote_id);
            conn.execute(
                "INSERT INTO departures (
                    remote_id, dep_ligne, dep_user, dep_numcar, dep_nom, dep_dest,
                    dep_place, dep_chauff, dep_conv, dep_date, dep_heure,
                    dep_fraisroute, dep_lavage, dep_carbur, dep_droitgare, dep_autredep,
                    ag_id, sync_status, created_at, updated_at
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20)",
                params![
                    remote_id,
                    dep["dep_ligne"].as_str(),
                    dep["dep_user"].as_i64().unwrap_or(0),
                    dep["dep_numcar"].as_str().unwrap_or(""),
                    dep["dep_nom"].as_str().unwrap_or(""),
                    dep["dep_dest"].as_str().unwrap_or(""),
                    dep["dep_place"].as_i64().unwrap_or(0),
                    dep["dep_chauff"].as_str().unwrap_or(""),
                    dep["dep_conv"].as_str().unwrap_or(""),
                    dep["dep_date"].as_str().unwrap_or(""),
                    dep["dep_heure"].as_str().unwrap_or(""),
                    dep["dep_fraisroute"].as_i64().unwrap_or(0),
                    dep["dep_lavage"].as_i64().unwrap_or(0),
                    dep["dep_carbur"].as_i64().unwrap_or(0),
                    dep["dep_droitgare"].as_i64().unwrap_or(0),
                    dep["dep_autredep"].as_i64().unwrap_or(0),
                    dep["ag_id"].as_i64().unwrap_or(0),
                    "synced",  // Les départs provenant de l'API sont déjà synchronisés
                    now,
                    now,
                ],
            )?;
        }
        count += 1;
    }

    Ok(count)
}

// Synchroniser les tickets depuis l'API
pub fn sync_tickets_from_api(conn: &Connection, tickets_data: Vec<serde_json::Value>) -> Result<usize> {
    let now = chrono::Utc::now().to_rfc3339();
    let mut count = 0;

    for ticket in tickets_data {
        let remote_id = ticket["tick_id"].as_i64().unwrap_or(0);

        // Vérifier si un ticket avec ce remote_id existe déjà
        let exists: bool = conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM tickets WHERE remote_id = ?1)",
            params![remote_id],
            |row| row.get(0),
        ).unwrap_or(false);

        if exists {
            // Mettre à jour le ticket existant
            println!("🔄 [SYNC] Mise à jour du ticket existant avec remote_id: {}", remote_id);
            conn.execute(
                "UPDATE tickets SET
                    tick_vtick = ?1,
                    tick_user = ?2,
                    tick_depart = ?3,
                    tick_price = ?4,
                    tick_reduc = ?5,
                    tick_dest = ?6,
                    tick_nom = ?7,
                    tick_phone = ?8,
                    tick_siege = ?9,
                    tick_nature = ?10,
                    tick_method = ?11,
                    tick_type = ?12,
                    sync_status = ?13,
                    updated_at = ?14
                WHERE remote_id = ?15",
                params![
                    ticket["tick_vtick"].as_i64(),
                    ticket["tick_user"].as_i64().unwrap_or(0),
                    ticket["tick_depart"].as_i64().unwrap_or(0),
                    ticket["tick_price"].as_str().unwrap_or("0"),
                    ticket["tick_reduc"].as_i64().unwrap_or(0),
                    ticket["tick_dest"].as_i64().unwrap_or(0),
                    ticket["tick_nom"].as_str().unwrap_or(""),
                    ticket["tick_phone"].as_str(),
                    ticket["tick_siege"].as_str().unwrap_or("0"),
                    ticket["tick_nature"].as_str().unwrap_or(""),
                    ticket["tick_method"].as_str().unwrap_or(""),
                    ticket["tick_type"].as_str(),
                    "synced",  // Les tickets provenant de l'API sont déjà synchronisés
                    now,
                    remote_id,
                ],
            )?;
        } else {
            // Insérer un nouveau ticket
            println!("➕ [SYNC] Insertion d'un nouveau ticket avec remote_id: {}", remote_id);
            conn.execute(
                "INSERT INTO tickets (
                    remote_id, tick_vtick, tick_user, tick_depart, tick_price,
                    tick_reduc, tick_dest, tick_nom, tick_phone, tick_siege,
                    tick_nature, tick_method, tick_type, sync_status, created_at, updated_at
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)",
                params![
                    remote_id,
                    ticket["tick_vtick"].as_i64(),
                    ticket["tick_user"].as_i64().unwrap_or(0),
                    ticket["tick_depart"].as_i64().unwrap_or(0),
                    ticket["tick_price"].as_str().unwrap_or("0"),
                    ticket["tick_reduc"].as_i64().unwrap_or(0),
                    ticket["tick_dest"].as_i64().unwrap_or(0),
                    ticket["tick_nom"].as_str().unwrap_or(""),
                    ticket["tick_phone"].as_str(),
                    ticket["tick_siege"].as_str().unwrap_or("0"),
                    ticket["tick_nature"].as_str().unwrap_or(""),
                    ticket["tick_method"].as_str().unwrap_or(""),
                    ticket["tick_type"].as_str(),
                    "synced",  // Les tickets provenant de l'API sont déjà synchronisés
                    now,
                    now,
                ],
            )?;
        }
        count += 1;
    }

    Ok(count)
}

// ============== STATISTICS ==============

pub fn get_ticket_stats(
    conn: &Connection,
    user_id: i64,
    start_date: &str,
    end_date: &str,
) -> Result<(i64, f64)> {
    println!("📊 [STATS] Paramètres reçus:");
    println!("   - user_id: {}", user_id);
    println!("   - start_date: {}", start_date);
    println!("   - end_date: {}", end_date);

    // Compter tous les tickets pour debug
    let total_tickets: i64 = conn.query_row(
        "SELECT COUNT(*) FROM tickets WHERE tick_user = ?1",
        params![user_id],
        |row| row.get(0),
    ).unwrap_or(0);
    println!("   - Total tickets pour l'utilisateur: {}", total_tickets);

    // Nombre de tickets dans la plage de dates
    // created_at est au format RFC3339, donc on utilise une comparaison de chaînes
    // SQLite compare les chaînes lexicographiquement, ce qui fonctionne pour les dates ISO
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM tickets
         WHERE tick_user = ?1
         AND datetime(created_at) >= datetime(?2)
         AND datetime(created_at) <= datetime(?3)",
        params![user_id, start_date, end_date],
        |row| row.get(0),
    ).unwrap_or(0);

    println!("   - Tickets dans la plage de dates: {}", count);

    // Somme des montants (tick_price - tick_reduc)
    // tick_price est stocké comme TEXT, donc on doit le convertir
    let total: f64 = conn.query_row(
        "SELECT COALESCE(SUM(CAST(tick_price AS REAL) - COALESCE(tick_reduc, 0)), 0)
         FROM tickets
         WHERE tick_user = ?1
         AND datetime(created_at) >= datetime(?2)
         AND datetime(created_at) <= datetime(?3)",
        params![user_id, start_date, end_date],
        |row| row.get(0),
    ).unwrap_or(0.0);

    println!("   - Total montant: {}", total);

    Ok((count, total))
}

// ============== ENTREPRISES ==============

pub fn sync_entreprises_from_api(conn: &Connection, entreprises_data: Vec<serde_json::Value>) -> Result<usize> {
    let now = chrono::Utc::now().to_rfc3339();
    let mut count = 0;

    for etp in entreprises_data {
        let remote_id = etp["etp_id"].as_i64().unwrap_or(0);

        // Utiliser INSERT OR REPLACE pour éviter les doublons
        conn.execute(
            "INSERT OR REPLACE INTO entreprises (
                remote_id, etp_code, etp_sender, etp_nom, etp_mail, etp_phone,
                etp_pays, etp_msgbagage, etp_msgcolis, etp_pass, etp_stat, etp_img,
                created_at, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12,
                COALESCE((SELECT created_at FROM entreprises WHERE remote_id = ?1), ?13),
                ?14
            )",
            params![
                remote_id,
                etp["etp_code"].as_str(),
                etp["etp_sender"].as_str(),
                etp["etp_nom"].as_str().unwrap_or(""),
                etp["etp_mail"].as_str(),
                etp["etp_phone"].as_str(),
                etp["etp_pays"].as_str(),
                etp["etp_msgbagage"].as_str(),
                etp["etp_msgcolis"].as_str(),
                etp["etp_pass"].as_str(),
                etp["etp_stat"].as_str(),
                etp["etp_img"].as_str(),
                now,
                now,
            ],
        )?;
        count += 1;
    }

    Ok(count)
}

pub fn get_all_entreprises(conn: &Connection) -> Result<Vec<Entreprise>> {
    let mut stmt = conn.prepare(
        "SELECT id, remote_id, etp_code, etp_sender, etp_nom, etp_mail, etp_phone,
                etp_pays, etp_msgbagage, etp_msgcolis, etp_pass, etp_stat, etp_img,
                etp_img_local, created_at, updated_at
         FROM entreprises
         ORDER BY etp_nom ASC"
    )?;

    let entreprises = stmt.query_map([], |row| {
        Ok(Entreprise {
            id: row.get(0)?,
            remote_id: row.get(1)?,
            etp_code: row.get(2)?,
            etp_sender: row.get(3)?,
            etp_nom: row.get(4)?,
            etp_mail: row.get(5)?,
            etp_phone: row.get(6)?,
            etp_pays: row.get(7)?,
            etp_msgbagage: row.get(8)?,
            etp_msgcolis: row.get(9)?,
            etp_pass: row.get(10)?,
            etp_stat: row.get(11)?,
            etp_img: row.get(12)?,
            etp_img_local: row.get(13)?,
            created_at: row.get(14)?,
            updated_at: row.get(15)?,
        })
    })?;

    entreprises.collect()
}

pub fn update_entreprise_img_local(conn: &Connection, remote_id: i64, img_local_path: &str) -> Result<()> {
    conn.execute(
        "UPDATE entreprises SET etp_img_local = ?1, updated_at = ?2 WHERE remote_id = ?3",
        params![img_local_path, Utc::now().to_rfc3339(), remote_id],
    )?;
    Ok(())
}

// ============== USERS ==============

pub fn sync_users_from_api(conn: &Connection, users_data: Vec<serde_json::Value>) -> Result<usize> {
    let now = chrono::Utc::now().to_rfc3339();
    let mut count = 0;

    for user in users_data {
        let remote_id = user["us_id"].as_i64().unwrap_or(0);

        // Utiliser INSERT OR REPLACE pour éviter les doublons
        conn.execute(
            "INSERT OR REPLACE INTO users (
                remote_id, us_agence, us_type, us_code, us_nom, us_email, us_phone,
                us_pass, us_stat, us_photo, us_device, us_printer,
                created_at, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12,
                COALESCE((SELECT created_at FROM users WHERE remote_id = ?1), ?13),
                ?14
            )",
            params![
                remote_id,
                user["us_agence"].as_i64().unwrap_or(0),
                user["us_type"].as_str(),
                user["us_code"].as_str(),
                user["us_nom"].as_str().unwrap_or(""),
                user["us_email"].as_str(),
                user["us_phone"].as_str(),
                user["us_pass"].as_str(),
                user["us_stat"].as_str(),
                user["us_photo"].as_str(),
                user["us_device"].as_str(),
                user["us_printer"].as_str(),
                now,
                now,
            ],
        )?;
        count += 1;
    }

    Ok(count)
}

pub fn get_all_users(conn: &Connection) -> Result<Vec<User>> {
    let mut stmt = conn.prepare(
        "SELECT id, remote_id, us_agence, us_type, us_code, us_nom, us_email, us_phone,
                us_pass, us_stat, us_photo, us_device, us_printer,
                created_at, updated_at
         FROM users
         ORDER BY us_nom ASC"
    )?;

    let users = stmt.query_map([], |row| {
        Ok(User {
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
        })
    })?;

    users.collect()
}

// ============== IMAGE DOWNLOAD ==============

pub async fn download_entreprise_image(
    db_path: &std::path::Path,
    remote_id: i64,
    image_url: &str,
    app_data_dir: &std::path::Path,
) -> Result<String> {
    use std::fs;

    // Créer le répertoire pour les images si nécessaire
    let images_dir = app_data_dir.join("images");
    fs::create_dir_all(&images_dir).map_err(|e| {
        rusqlite::Error::ToSqlConversionFailure(Box::new(e))
    })?;

    // Extraire l'extension du fichier de l'URL
    let extension = image_url
        .split('.')
        .last()
        .unwrap_or("jpg");

    let filename = format!("etp_{}.{}", remote_id, extension);
    let file_path = images_dir.join(&filename);

    // Télécharger l'image
    let client = reqwest::Client::new();
    match client.get(image_url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.bytes().await {
                    Ok(bytes) => {
                        fs::write(&file_path, &bytes).map_err(|e| {
                            rusqlite::Error::ToSqlConversionFailure(Box::new(e))
                        })?;

                        let local_path = file_path.to_string_lossy().to_string();

                        // Mettre à jour la BD avec le chemin local (ouvrir une nouvelle connexion)
                        let conn = Connection::open(db_path)?;
                        update_entreprise_img_local(&conn, remote_id, &local_path)?;

                        println!("✅ [IMAGE] Image téléchargée pour entreprise {}: {}", remote_id, local_path);
                        Ok(local_path)
                    }
                    Err(e) => {
                        println!("❌ [IMAGE] Erreur lors de la lecture des bytes: {}", e);
                        Err(rusqlite::Error::ToSqlConversionFailure(Box::new(e)))
                    }
                }
            } else {
                let err_msg = format!("HTTP error: {}", response.status());
                println!("❌ [IMAGE] {}", err_msg);
                Err(rusqlite::Error::ToSqlConversionFailure(
                    Box::new(std::io::Error::new(std::io::ErrorKind::Other, err_msg))
                ))
            }
        }
        Err(e) => {
            println!("❌ [IMAGE] Erreur lors du téléchargement: {}", e);
            Err(rusqlite::Error::ToSqlConversionFailure(Box::new(e)))
        }
    }
}
