use rusqlite::{Connection, Result};
use tauri::{AppHandle, Manager};

pub mod models;
pub mod operations;
pub mod sync;

pub struct Database {
    pub conn: Connection,
}

impl Database {
    pub fn new(app_handle: &AppHandle) -> Result<Self> {
        let app_dir = app_handle
            .path()
            .app_data_dir()
            .expect("Failed to get app data dir");

        std::fs::create_dir_all(&app_dir).expect("Failed to create app data dir");

        let db_path = app_dir.join("fast_app.db");
        let conn = Connection::open(db_path)?;

        Ok(Database { conn })
    }

    pub fn init(&self) -> Result<()> {
        self.create_tables()?;
        Ok(())
    }

    fn create_tables(&self) -> Result<()> {
        // Table des départs
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS departures (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                remote_id INTEGER,
                dep_ligne TEXT,
                dep_user INTEGER NOT NULL,
                dep_numcar TEXT NOT NULL,
                dep_nom TEXT NOT NULL,
                dep_dest TEXT NOT NULL,
                dep_place INTEGER NOT NULL,
                dep_chauff TEXT NOT NULL,
                dep_conv TEXT NOT NULL,
                dep_date TEXT NOT NULL,
                dep_heure TEXT NOT NULL,
                dep_fraisroute REAL DEFAULT 0,
                dep_lavage REAL DEFAULT 0,
                dep_carbur REAL DEFAULT 0,
                dep_droitgare REAL DEFAULT 0,
                dep_autredep REAL DEFAULT 0,
                ag_id INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                sync_status TEXT NOT NULL DEFAULT 'pending',
                last_sync_attempt TEXT,
                sync_error TEXT
            )",
            [],
        )?;

        // Table des tickets
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                remote_id INTEGER,
                tick_vtick INTEGER,
                tick_user INTEGER NOT NULL,
                tick_depart INTEGER NOT NULL,
                tick_price TEXT NOT NULL,
                tick_reduc REAL DEFAULT 0,
                tick_dest INTEGER NOT NULL,
                tick_nom TEXT NOT NULL,
                tick_phone TEXT,
                tick_siege TEXT NOT NULL,
                tick_nature TEXT NOT NULL,
                tick_method TEXT NOT NULL,
                tick_type TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                sync_status TEXT NOT NULL DEFAULT 'pending',
                last_sync_attempt TEXT,
                sync_error TEXT,
                FOREIGN KEY (tick_depart) REFERENCES departures(id)
            )",
            [],
        )?;

        // Table des colis
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS colis (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                remote_id INTEGER,
                exp_user INTEGER NOT NULL,
                exp_type TEXT DEFAULT 'COLIS',
                exp_depart INTEGER NOT NULL,
                exp_bord TEXT,
                exp_numcar TEXT NOT NULL,
                exp_colnat TEXT NOT NULL,
                exp_colval TEXT NOT NULL,
                exp_frais TEXT NOT NULL,
                exp_stat INTEGER DEFAULT 0,
                exp_coldesc TEXT NOT NULL,
                exp_code TEXT,
                exp_exp TEXT NOT NULL,
                exp_phonexp TEXT NOT NULL,
                exp_dest TEXT NOT NULL,
                exp_destphone TEXT NOT NULL,
                exp_agdest TEXT NOT NULL,
                exp_siege TEXT,
                exp_img TEXT,
                exp_imgret TEXT,
                exp_destdevice TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                sync_status TEXT NOT NULL DEFAULT 'pending',
                last_sync_attempt TEXT,
                sync_error TEXT,
                FOREIGN KEY (exp_depart) REFERENCES departures(id)
            )",
            [],
        )?;

        // Table des bagages
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS bagages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                remote_id INTEGER,
                exp_user INTEGER NOT NULL,
                exp_type TEXT DEFAULT 'BAGAGE',
                exp_depart INTEGER NOT NULL,
                exp_bord TEXT,
                exp_numcar TEXT NOT NULL,
                exp_colnat TEXT NOT NULL,
                exp_colval TEXT NOT NULL,
                exp_frais TEXT NOT NULL,
                exp_stat INTEGER DEFAULT 0,
                exp_coldesc TEXT NOT NULL,
                exp_code TEXT,
                exp_exp TEXT NOT NULL,
                exp_phonexp TEXT NOT NULL,
                exp_dest INTEGER NOT NULL,
                exp_siege TEXT NOT NULL,
                exp_img TEXT,
                exp_imgret TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                sync_status TEXT NOT NULL DEFAULT 'pending',
                last_sync_attempt TEXT,
                sync_error TEXT,
                FOREIGN KEY (exp_depart) REFERENCES departures(id)
            )",
            [],
        )?;

        // Table des entreprises
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS entreprises (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                remote_id INTEGER UNIQUE,
                etp_code TEXT,
                etp_sender TEXT,
                etp_nom TEXT NOT NULL,
                etp_mail TEXT,
                etp_phone TEXT,
                etp_pays TEXT,
                etp_msgbagage TEXT,
                etp_msgcolis TEXT,
                etp_pass TEXT,
                etp_stat TEXT,
                etp_img TEXT,
                etp_img_local TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
            [],
        )?;

        // Table des agences (gares de destination)
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS agences (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                remote_id INTEGER UNIQUE,
                ag_code TEXT,
                ag_nom TEXT NOT NULL,
                ag_phone TEXT,
                ag_pays TEXT,
                ag_ville TEXT,
                ag_devise TEXT,
                ag_prefix TEXT,
                ag_stat TEXT,
                ag_etp INTEGER,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (ag_etp) REFERENCES entreprises(remote_id)
            )",
            [],
        )?;

        // Table des utilisateurs
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                remote_id INTEGER UNIQUE,
                us_agence INTEGER NOT NULL,
                us_type TEXT,
                us_code TEXT,
                us_nom TEXT NOT NULL,
                us_email TEXT,
                us_phone TEXT,
                us_pass TEXT,
                us_stat TEXT,
                us_photo TEXT,
                us_device TEXT,
                us_printer TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (us_agence) REFERENCES agences(remote_id)
            )",
            [],
        )?;

        // Table des destinations (pour les prix de destinations)
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS destinations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                remote_id INTEGER UNIQUE,
                dest_user INTEGER NOT NULL,
                dest_agence INTEGER NOT NULL,
                dest_ville TEXT NOT NULL,
                dest_price TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
            [],
        )?;

        // Table de synchronisation (pour tracker les opérations en attente)
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS sync_queue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entity_type TEXT NOT NULL,
                entity_id INTEGER NOT NULL,
                operation TEXT NOT NULL,
                payload TEXT NOT NULL,
                created_at TEXT NOT NULL,
                retry_count INTEGER DEFAULT 0,
                last_error TEXT
            )",
            [],
        )?;

        // Index pour améliorer les performances
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_departures_sync ON departures(sync_status)",
            [],
        )?;

        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_tickets_sync ON tickets(sync_status)",
            [],
        )?;

        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_tickets_depart ON tickets(tick_depart)",
            [],
        )?;

        self.conn.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_agences_remote ON agences(remote_id)",
            [],
        )?;

        self.conn.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_destinations_remote ON destinations(remote_id)",
            [],
        )?;

        self.conn.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_entreprises_remote ON entreprises(remote_id)",
            [],
        )?;

        self.conn.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_remote ON users(remote_id)",
            [],
        )?;

        Ok(())
    }
}
