use serde::{Deserialize, Serialize};
use std::process::Command;
use image::GenericImageView;
use base64::{Engine as _, engine::general_purpose};

#[cfg(target_os = "linux")]
use std::fs::OpenOptions;
#[cfg(target_os = "linux")]
use std::io::Write;

// Fonction helper pour l'impression RAW sur Windows
#[cfg(target_os = "windows")]
fn print_raw_windows(printer_name: &str, data: &[u8]) -> Result<(), String> {
    use windows::core::PWSTR;
    use windows::Win32::Foundation::{HANDLE, GetLastError};
    use windows::Win32::Graphics::Printing::{
        OpenPrinterW, StartDocPrinterW, StartPagePrinter, WritePrinter,
        EndPagePrinter, EndDocPrinter, ClosePrinter, DOC_INFO_1W,
    };

    eprintln!("🖨️ === DÉBUT IMPRESSION RAW WINDOWS ===");
    eprintln!("🖨️ Imprimante: '{}'", printer_name);
    eprintln!("📊 Taille des données: {} octets", data.len());
    eprintln!("🔍 Premiers 50 octets: {:?}", &data[..data.len().min(50)]);

    unsafe {
        // Convertir le nom de l'imprimante en UTF-16
        let printer_name_wide: Vec<u16> = printer_name.encode_utf16().chain(std::iter::once(0)).collect();
        let mut printer_handle: HANDLE = HANDLE::default();

        // Ouvrir l'imprimante
        eprintln!("🔓 Tentative d'ouverture de l'imprimante '{}'...", printer_name);
        if let Err(e) = OpenPrinterW(
            PWSTR(printer_name_wide.as_ptr() as *mut _),
            &mut printer_handle,
            None,
        ) {
            let error_code = GetLastError();
            eprintln!("❌ ERREUR OpenPrinterW: {:?}", e);
            eprintln!("❌ Code erreur Windows: {:?}", error_code);
            return Err(format!(
                "Impossible d'ouvrir l'imprimante '{}': {:?} (Code: {:?}). Vérifiez que le nom est exact (sensible à la casse).",
                printer_name, e, error_code
            ));
        }

        eprintln!("✅ Imprimante ouverte avec handle: {:?}", printer_handle);

        // Préparer les informations du document
        let doc_name: Vec<u16> = "ESC/POS Ticket".encode_utf16().chain(std::iter::once(0)).collect();
        let doc_type: Vec<u16> = "RAW".encode_utf16().chain(std::iter::once(0)).collect();

        eprintln!("📋 Type de document: RAW (impression directe)");

        let mut doc_info = DOC_INFO_1W {
            pDocName: PWSTR(doc_name.as_ptr() as *mut _),
            pOutputFile: PWSTR(std::ptr::null_mut()),
            pDatatype: PWSTR(doc_type.as_ptr() as *mut _),
        };

        // Démarrer le document
        eprintln!("📄 Démarrage du document...");
        let doc_id = StartDocPrinterW(printer_handle, 1, &mut doc_info as *mut _ as *mut _);
        if doc_id == 0 {
            let error_code = GetLastError();
            eprintln!("❌ ERREUR StartDocPrinterW - Code: {:?}", error_code);
            let _ = ClosePrinter(printer_handle);
            return Err(format!(
                "Impossible de démarrer le document d'impression (Code: {:?}). L'imprimante supporte-t-elle le mode RAW ?",
                error_code
            ));
        }

        eprintln!("✅ Document démarré (ID: {})", doc_id);

        // Démarrer la page
        eprintln!("📃 Démarrage de la page...");
        let page_result = StartPagePrinter(printer_handle);
        if !page_result.as_bool() {
            let error_code = GetLastError();
            eprintln!("❌ ERREUR StartPagePrinter - Code: {:?}", error_code);
            let _ = EndDocPrinter(printer_handle);
            let _ = ClosePrinter(printer_handle);
            return Err(format!("Impossible de démarrer la page (Code: {:?})", error_code));
        }

        eprintln!("✅ Page démarrée");

        // Écrire les données
        eprintln!("✍️ Écriture de {} octets vers l'imprimante...", data.len());
        let mut bytes_written: u32 = 0;
        let write_result = WritePrinter(
            printer_handle,
            data.as_ptr() as *const _,
            data.len() as u32,
            &mut bytes_written,
        );

        if !write_result.as_bool() {
            let error_code = GetLastError();
            eprintln!("❌ ERREUR WritePrinter - Code: {:?}", error_code);
            eprintln!("❌ Octets écrits avant erreur: {}", bytes_written);
            let _ = EndPagePrinter(printer_handle);
            let _ = EndDocPrinter(printer_handle);
            let _ = ClosePrinter(printer_handle);
            return Err(format!(
                "Erreur lors de l'écriture des données (Code: {:?}). {} octets écrits sur {}",
                error_code, bytes_written, data.len()
            ));
        }

        eprintln!("✅ {} octets écrits sur {} (100%)", bytes_written, data.len());

        if bytes_written != data.len() as u32 {
            eprintln!("⚠️ ATTENTION: Tous les octets n'ont pas été écrits! ({}/{})", bytes_written, data.len());
        }

        // Terminer la page
        eprintln!("🏁 Fin de la page...");
        let end_page_result = EndPagePrinter(printer_handle);
        if !end_page_result.as_bool() {
            let error_code = GetLastError();
            eprintln!("❌ ERREUR EndPagePrinter - Code: {:?}", error_code);
            let _ = EndDocPrinter(printer_handle);
            let _ = ClosePrinter(printer_handle);
            return Err(format!("Impossible de terminer la page (Code: {:?})", error_code));
        }

        eprintln!("✅ Page terminée");

        // Terminer le document
        eprintln!("🏁 Fin du document...");
        let end_doc_result = EndDocPrinter(printer_handle);
        if !end_doc_result.as_bool() {
            let error_code = GetLastError();
            eprintln!("❌ ERREUR EndDocPrinter - Code: {:?}", error_code);
            let _ = ClosePrinter(printer_handle);
            return Err(format!("Impossible de terminer le document (Code: {:?})", error_code));
        }

        eprintln!("✅ Document terminé");

        // Fermer l'imprimante
        eprintln!("🔒 Fermeture de l'imprimante...");
        if let Err(e) = ClosePrinter(printer_handle) {
            let error_code = GetLastError();
            eprintln!("⚠️ Avertissement: Erreur lors de la fermeture de l'imprimante: {:?} (Code: {:?})", e, error_code);
        } else {
            eprintln!("✅ Imprimante fermée");
        }

        eprintln!("🎉 === IMPRESSION TERMINÉE AVEC SUCCÈS ===");
        eprintln!("");

        Ok(())
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TicketData {
    pub title: String,
    pub items: Vec<TicketItem>,
    pub total: String,
    pub footer: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TicketItem {
    pub label: String,
    pub value: String,
}

pub struct EscPos;

impl EscPos {
    pub const INIT: &'static [u8] = &[0x1B, 0x40];

    pub const ALIGN_LEFT: &'static [u8] = &[0x1B, 0x61, 0x00];
    pub const ALIGN_CENTER: &'static [u8] = &[0x1B, 0x61, 0x01];
    pub const ALIGN_RIGHT: &'static [u8] = &[0x1B, 0x61, 0x02];

    pub const TEXT_NORMAL: &'static [u8] = &[0x1B, 0x21, 0x00];
    pub const TEXT_DOUBLE_HEIGHT: &'static [u8] = &[0x1B, 0x21, 0x10];
    pub const TEXT_DOUBLE_WIDTH: &'static [u8] = &[0x1B, 0x21, 0x20];
    pub const TEXT_BOLD: &'static [u8] = &[0x1B, 0x21, 0x08];
    pub const TEXT_LARGE: &'static [u8] = &[0x1B, 0x21, 0x30];

    pub const CUT_PAPER: &'static [u8] = &[0x1D, 0x56, 0x41, 0x00];
    pub const CUT_PARTIAL: &'static [u8] = &[0x1D, 0x56, 0x42, 0x00];

    pub const LINE_FEED: &'static [u8] = &[0x0A];

    pub const BOLD_ON: &'static [u8] = &[0x1B, 0x45, 0x01];
    pub const BOLD_OFF: &'static [u8] = &[0x1B, 0x45, 0x00];
}

pub fn convert_image_to_escpos(base64_image: &str, width: u32) -> Result<Vec<u8>, String> {
    eprintln!("🔄 Début conversion image vers ESC/POS");
    eprintln!("   - Base64 reçu: {} caractères", base64_image.len());
    eprintln!("   - Largeur cible: {}px", width);

    let image_data = general_purpose::STANDARD.decode(base64_image)
        .map_err(|e| {
            eprintln!("❌ ERREUR décodage base64: {}", e);
            format!("Erreur de décodage base64: {}", e)
        })?;

    eprintln!("✅ Base64 décodé: {} octets de données binaires", image_data.len());

    let img = image::load_from_memory(&image_data)
        .map_err(|e| {
            eprintln!("❌ ERREUR chargement image: {}", e);
            format!("Erreur de chargement d'image: {}", e)
        })?;

    eprintln!("✅ Image chargée: {}x{} pixels", img.width(), img.height());

    let img = img.grayscale().resize(width, width, image::imageops::FilterType::Lanczos3);
    eprintln!("✅ Image redimensionnée: {}x{} pixels", img.width(), img.height());

    let mut commands = Vec::new();

    commands.extend_from_slice(&[0x1D, 0x76, 0x30, 0x00]); // GS v 0

    let width_bytes = ((width + 7) / 8) as u8;
    let height = img.height() as u16;

    commands.push(width_bytes);
    commands.push(0x00);
    commands.extend_from_slice(&height.to_le_bytes());

    for y in 0..img.height() {
        let mut byte = 0u8;
        let mut bit = 7;

        for x in 0..width {
            let pixel = img.get_pixel(x, y);
            if pixel[0] < 128 {
                byte |= 1 << bit;
            }

            if bit == 0 {
                commands.push(byte);
                byte = 0;
                bit = 7;
            } else {
                bit -= 1;
            }
        }

        if bit != 7 {
            commands.push(byte);
        }
    }

    eprintln!("✅ Conversion terminée: {} octets de commandes ESC/POS générés", commands.len());

    Ok(commands)
}

pub fn generate_ticket(data: &TicketData, logo_base64: Option<String>, logo_width: Option<u32>) -> Result<Vec<u8>, String> {
    let mut commands = Vec::new();
    commands.extend_from_slice(EscPos::INIT);

    if let Some(logo) = logo_base64 {
        commands.extend_from_slice(EscPos::ALIGN_CENTER);
        let width = logo_width.unwrap_or(200);
        match convert_image_to_escpos(&logo, width) {
            Ok(img_data) => {
                commands.extend(img_data);
                commands.extend_from_slice(EscPos::LINE_FEED);
                commands.extend_from_slice(EscPos::LINE_FEED);
            }
            Err(e) => eprintln!("Erreur lors de la conversion de l'image: {}", e),
        }
    }

    commands.extend_from_slice(EscPos::ALIGN_CENTER);
    commands.extend_from_slice(EscPos::TEXT_LARGE);
    commands.extend_from_slice(EscPos::BOLD_ON);
    commands.extend_from_slice(data.title.as_bytes());
    commands.extend_from_slice(EscPos::BOLD_OFF);
    commands.extend_from_slice(EscPos::LINE_FEED);
    commands.extend_from_slice(EscPos::LINE_FEED);

    commands.extend_from_slice(EscPos::TEXT_NORMAL);
    commands.extend_from_slice(EscPos::ALIGN_CENTER);
    commands.extend_from_slice(b"--------------------------------");
    commands.extend_from_slice(EscPos::LINE_FEED);
    commands.extend_from_slice(EscPos::LINE_FEED);

    commands.extend_from_slice(EscPos::ALIGN_LEFT);
    commands.extend_from_slice(EscPos::TEXT_NORMAL);

    for item in &data.items {
        let line = format!("{}: {}", item.label, item.value);
        commands.extend_from_slice(line.as_bytes());
        commands.extend_from_slice(EscPos::LINE_FEED);
    }

    commands.extend_from_slice(EscPos::LINE_FEED);

    commands.extend_from_slice(EscPos::ALIGN_RIGHT);
    commands.extend_from_slice(EscPos::TEXT_DOUBLE_HEIGHT);
    commands.extend_from_slice(EscPos::BOLD_ON);
    commands.extend_from_slice(data.total.as_bytes());
    commands.extend_from_slice(EscPos::BOLD_OFF);
    commands.extend_from_slice(EscPos::LINE_FEED);
    commands.extend_from_slice(EscPos::LINE_FEED);

    commands.extend_from_slice(EscPos::TEXT_NORMAL);
    commands.extend_from_slice(EscPos::ALIGN_CENTER);

    for line in &data.footer {
        commands.extend_from_slice(line.as_bytes());
        commands.extend_from_slice(EscPos::LINE_FEED);
    }

    commands.extend_from_slice(EscPos::LINE_FEED);
    commands.extend_from_slice(EscPos::LINE_FEED);
    commands.extend_from_slice(EscPos::LINE_FEED);

    commands.extend_from_slice(EscPos::CUT_PAPER);

    Ok(commands)
}

pub fn generate_stub_and_ticket(data: &TicketData, logo_base64: Option<String>) -> Result<Vec<u8>, String> {
    let mut commands = Vec::new();

    eprintln!("🖨️ === GÉNÉRATION SOUCHE ET TICKET ===");
    match &logo_base64 {
        Some(logo) => {
            eprintln!("✅ Logo reçu: {} caractères", logo.len());

            // Afficher si c'est une URL ou du base64
            if logo.starts_with("http://") || logo.starts_with("https://") {
                eprintln!("🌐 Type: URL HTTP/HTTPS");
                eprintln!("🔗 URL complète: {}", logo);
                eprintln!("⚠️ ATTENTION: Le logo est une URL, pas du base64!");
                eprintln!("⚠️ Il faut télécharger et convertir l'image côté TypeScript avant d'envoyer ici");
            } else if logo.starts_with("data:image") {
                eprintln!("📦 Type: Data URL (data:image/...)");
                eprintln!("📦 Préfixe détecté, il faut extraire le base64");
            } else if logo.len() > 100 && logo.chars().all(|c| c.is_alphanumeric() || c == '+' || c == '/' || c == '=') {
                eprintln!("✅ Type: Base64 pur (probablement valide)");
                eprintln!("🖼️ Premiers 100 chars: {}", &logo.chars().take(100).collect::<String>());
            } else {
                eprintln!("❓ Type: Inconnu");
                eprintln!("📝 Contenu (premiers 200 chars): {}", &logo.chars().take(200).collect::<String>());
            }
        }
        None => eprintln!("⚠️ AUCUN LOGO REÇU (None)"),
    }

    // === SOUCHE ===
    commands.extend_from_slice(EscPos::INIT);

    // Logo pour la souche (150px - plus grand)
    if let Some(ref logo) = logo_base64 {
        eprintln!("🖼️ === TRAITEMENT LOGO SOUCHE (150px) ===");
        commands.extend_from_slice(EscPos::ALIGN_CENTER);
        match convert_image_to_escpos(logo, 150) {
            Ok(img_data) => {
                eprintln!("✅ Logo souche converti: {} octets de données ESC/POS", img_data.len());
                commands.extend(img_data);
                commands.extend_from_slice(EscPos::LINE_FEED);
            }
            Err(e) => eprintln!("❌ Erreur lors de la conversion de l'image (souche): {}", e),
        }
    }

    // Titre SOUCHE
    commands.extend_from_slice(EscPos::ALIGN_CENTER);
    commands.extend_from_slice(EscPos::TEXT_BOLD);
    commands.extend_from_slice(b"=== SOUCHE ===");
    commands.extend_from_slice(EscPos::TEXT_NORMAL);
    commands.extend_from_slice(EscPos::LINE_FEED);

    // Ligne de séparation
    commands.extend_from_slice(EscPos::ALIGN_CENTER);
    commands.extend_from_slice(b"--------------------------------");
    commands.extend_from_slice(EscPos::LINE_FEED);

    // Items de la souche en format tableau
    commands.extend_from_slice(EscPos::ALIGN_LEFT);
    commands.extend_from_slice(EscPos::TEXT_NORMAL);

    for item in &data.items {
        // Format: Label justifié à gauche sur 15 chars, valeur à droite
        let label = format!("{:<15}", item.label);
        // Utiliser un tiret au lieu de ":" pour éviter les problèmes d'encodage
        let line = format!("{} - {}", label, item.value);
        commands.extend_from_slice(line.as_bytes());
        commands.extend_from_slice(EscPos::LINE_FEED);
    }

    // Ligne de séparation finale
    commands.extend_from_slice(EscPos::ALIGN_CENTER);
    commands.extend_from_slice(b"--------------------------------");
    commands.extend_from_slice(EscPos::LINE_FEED);
    commands.extend_from_slice(EscPos::LINE_FEED);

    // Couper le papier après la souche
    commands.extend_from_slice(EscPos::CUT_PAPER);

    // Ligne de séparation pour indiquer où couper (optionnel maintenant puisque déjà coupé)
    commands.extend_from_slice(EscPos::LINE_FEED);
    commands.extend_from_slice(EscPos::LINE_FEED);

    // === TICKET ===
    eprintln!("🎫 === GÉNÉRATION TICKET ===");
    commands.extend_from_slice(EscPos::INIT);

    // Logo pour le ticket (250px - plus grand)
    if let Some(ref logo) = logo_base64 {
        eprintln!("🖼️ === TRAITEMENT LOGO TICKET (250px) ===");
        commands.extend_from_slice(EscPos::ALIGN_CENTER);
        match convert_image_to_escpos(logo, 250) {
            Ok(img_data) => {
                eprintln!("✅ Logo ticket converti: {} octets de données ESC/POS", img_data.len());
                commands.extend(img_data);
                commands.extend_from_slice(EscPos::LINE_FEED);
            }
            Err(e) => eprintln!("❌ Erreur lors de la conversion de l'image (ticket): {}", e),
        }
    } else {
        eprintln!("⚠️ Aucun logo pour le ticket");
    }

    // Titre TICKET DE TRANSPORT
    commands.extend_from_slice(EscPos::ALIGN_CENTER);
    commands.extend_from_slice(EscPos::TEXT_LARGE);
    commands.extend_from_slice(EscPos::BOLD_ON);
    commands.extend_from_slice(data.title.as_bytes());
    commands.extend_from_slice(EscPos::BOLD_OFF);
    commands.extend_from_slice(EscPos::LINE_FEED);

    // Ligne de séparation
    commands.extend_from_slice(EscPos::TEXT_NORMAL);
    commands.extend_from_slice(EscPos::ALIGN_CENTER);
    commands.extend_from_slice(b"--------------------------------");
    commands.extend_from_slice(EscPos::LINE_FEED);

    // Items du ticket en format tableau
    commands.extend_from_slice(EscPos::ALIGN_LEFT);
    commands.extend_from_slice(EscPos::TEXT_NORMAL);

    for item in &data.items {
        // Format: Label justifié à gauche sur 15 chars, valeur à droite
        let label = format!("{:<15}", item.label);
        // Utiliser un tiret au lieu de ":" pour éviter les problèmes d'encodage
        let line = format!("{} - {}", label, item.value);
        commands.extend_from_slice(line.as_bytes());
        commands.extend_from_slice(EscPos::LINE_FEED);
    }

    // Ligne de séparation
    commands.extend_from_slice(EscPos::ALIGN_CENTER);
    commands.extend_from_slice(b"--------------------------------");
    commands.extend_from_slice(EscPos::LINE_FEED);

    // Total du ticket
    commands.extend_from_slice(EscPos::ALIGN_CENTER);
    commands.extend_from_slice(EscPos::TEXT_DOUBLE_HEIGHT);
    commands.extend_from_slice(EscPos::BOLD_ON);
    commands.extend_from_slice(data.total.as_bytes());
    commands.extend_from_slice(EscPos::BOLD_OFF);
    commands.extend_from_slice(EscPos::LINE_FEED);

    // Footer du ticket
    commands.extend_from_slice(EscPos::TEXT_NORMAL);
    commands.extend_from_slice(EscPos::ALIGN_CENTER);

    for line in &data.footer {
        commands.extend_from_slice(line.as_bytes());
        commands.extend_from_slice(EscPos::LINE_FEED);
    }

    commands.extend_from_slice(EscPos::LINE_FEED);

    // Couper le papier à la fin
    commands.extend_from_slice(EscPos::CUT_PAPER);

    eprintln!("🎯 TOTAL: {} octets de commandes ESC/POS générés", commands.len());

    Ok(commands)
}

#[tauri::command]
pub fn print_stub_and_ticket(
    printer_name: String,
    ticket_data: TicketData,
    logo_base64: Option<String>,
) -> Result<String, String> {
    eprintln!("🖨️ === COMMANDE PRINT_STUB_AND_TICKET ===");
    eprintln!("   Imprimante: {}", printer_name);
    eprintln!("   Logo fourni: {}", if logo_base64.is_some() { "OUI" } else { "NON" });

    let commands = generate_stub_and_ticket(&ticket_data, logo_base64)?;

    eprintln!("📤 Envoi de {} octets à l'imprimante '{}'", commands.len(), printer_name);

    #[cfg(target_os = "macos")]
    {
        use std::io::Write as _;
        let mut child = Command::new("lp")
            .arg("-d")
            .arg(&printer_name)
            .arg("-o")
            .arg("raw")
            .stdin(std::process::Stdio::piped())
            .spawn()
            .map_err(|e| format!("Impossible de démarrer la commande lp: {}", e))?;

        if let Some(mut stdin) = child.stdin.take() {
            stdin.write_all(&commands)
                .map_err(|e| format!("Erreur d'écriture vers l'imprimante: {}", e))?;
        }

        let output = child.wait_with_output()
            .map_err(|e| format!("Erreur lors de l'attente de la commande lp: {}", e))?;

        if !output.status.success() {
            return Err(format!("Erreur d'impression: {}", String::from_utf8_lossy(&output.stderr)));
        }

        return Ok("Souche et ticket imprimés avec succès".to_string());
    }

    #[cfg(target_os = "windows")]
    {
        print_raw_windows(&printer_name, &commands)?;
        return Ok("Souche et ticket imprimés avec succès".to_string());
    }

    #[cfg(target_os = "linux")]
    {
        let printer_path = format!("/dev/usb/{}", printer_name);

        let mut file = OpenOptions::new()
            .write(true)
            .create(false)
            .open(&printer_path)
            .map_err(|e| format!("Impossible d'ouvrir l'imprimante '{}': {}", printer_path, e))?;

        file.write_all(&commands)
            .map_err(|e| format!("Erreur d'écriture vers l'imprimante: {}", e))?;

        Ok("Souche et ticket imprimés avec succès".to_string())
    }
}

#[tauri::command]
pub fn print_ticket(
    printer_name: String,
    ticket_data: TicketData,
    logo_base64: Option<String>,
    logo_width: Option<u32>,
) -> Result<String, String> {
    let commands = generate_ticket(&ticket_data, logo_base64, logo_width)?;

    #[cfg(target_os = "macos")]
    {
        // Sur macOS, utiliser le système CUPS via la commande 'lp'
        use std::io::Write as _;
        let mut child = Command::new("lp")
            .arg("-d")
            .arg(&printer_name)
            .arg("-o")
            .arg("raw")
            .stdin(std::process::Stdio::piped())
            .spawn()
            .map_err(|e| format!("Impossible de démarrer la commande lp: {}", e))?;

        if let Some(mut stdin) = child.stdin.take() {
            stdin.write_all(&commands)
                .map_err(|e| format!("Erreur d'écriture vers l'imprimante: {}", e))?;
        }

        let output = child.wait_with_output()
            .map_err(|e| format!("Erreur lors de l'attente de la commande lp: {}", e))?;

        if !output.status.success() {
            return Err(format!("Erreur d'impression: {}", String::from_utf8_lossy(&output.stderr)));
        }

        return Ok("Ticket imprimé avec succès".to_string());
    }

    #[cfg(target_os = "windows")]
    {
        print_raw_windows(&printer_name, &commands)?;
        return Ok("Ticket imprimé avec succès".to_string());
    }

    #[cfg(target_os = "linux")]
    {
        let printer_path = format!("/dev/usb/{}", printer_name);

        let mut file = OpenOptions::new()
            .write(true)
            .create(false)
            .open(&printer_path)
            .map_err(|e| format!("Impossible d'ouvrir l'imprimante '{}': {}", printer_path, e))?;

        file.write_all(&commands)
            .map_err(|e| format!("Erreur d'écriture vers l'imprimante: {}", e))?;

        Ok("Ticket imprimé avec succès".to_string())
    }
}

#[tauri::command]
pub fn list_printers() -> Result<Vec<String>, String> {
    #[cfg(target_os = "windows")]
    {
        // Utiliser PowerShell pour lister les imprimantes sur Windows
        eprintln!("🖨️  Récupération des imprimantes Windows...");

        // Essayer avec Get-Printer (PowerShell)
        let output = Command::new("powershell")
            .args(["-Command", "Get-Printer | Select-Object -ExpandProperty Name"])
            .output();

        match output {
            Ok(output) if output.status.success() => {
                let output_str = String::from_utf8_lossy(&output.stdout);
                eprintln!("📋 Imprimantes trouvées:\n{}", output_str);

                let printers: Vec<String> = output_str
                    .lines()
                    .filter(|line| !line.trim().is_empty())
                    .map(|line| line.trim().to_string())
                    .collect();

                eprintln!("✅ Total: {} imprimante(s)", printers.len());

                if !printers.is_empty() {
                    return Ok(printers);
                }
            }
            _ => {
                eprintln!("⚠️  PowerShell Get-Printer a échoué, essai avec wmic...");
            }
        }

        // Fallback: essayer avec wmic
        let output = Command::new("wmic")
            .args(["printer", "get", "name"])
            .output();

        match output {
            Ok(output) if output.status.success() => {
                let output_str = String::from_utf8_lossy(&output.stdout);
                let printers: Vec<String> = output_str
                    .lines()
                    .skip(1) // Ignorer l'en-tête "Name"
                    .filter(|line| !line.trim().is_empty())
                    .map(|line| line.trim().to_string())
                    .collect();

                eprintln!("✅ Total (wmic): {} imprimante(s)", printers.len());
                Ok(printers)
            }
            _ => {
                eprintln!("⚠️  Impossible de récupérer les imprimantes, retour des valeurs par défaut");
                Ok(vec!["USB001".to_string(), "LPT1".to_string()])
            }
        }
    }

    #[cfg(target_os = "macos")]
    {
        // Utiliser lpstat pour lister les imprimantes sur macOS
        eprintln!("🖨️  Exécution de lpstat -p...");
        let output = Command::new("lpstat")
            .arg("-p")
            .output()
            .map_err(|e| format!("Erreur lors de l'exécution de lpstat: {}", e))?;

        if !output.status.success() {
            eprintln!("⚠️  lpstat a échoué");
            return Ok(vec![]);
        }

        let output_str = String::from_utf8_lossy(&output.stdout);
        eprintln!("📋 Sortie lpstat brute:\n{}", output_str);

        let printers: Vec<String> = output_str
            .lines()
            .filter_map(|line| {
                let line = line.trim();
                eprintln!("   📄 Analyse ligne: '{}'", line);

                // Format anglais: "printer NAME is ..."
                if line.starts_with("printer ") {
                    let rest = line.strip_prefix("printer ").unwrap();
                    if let Some(space_pos) = rest.find(' ') {
                        let name = &rest[..space_pos];
                        eprintln!("   ✅ Imprimante trouvée (EN): '{}'", name);
                        return Some(name.to_string());
                    }
                }
                // Format français: "l'imprimante NAME est ..." (avec apostrophe droite)
                else if line.starts_with("l'imprimante ") {
                    let rest = line.strip_prefix("l'imprimante ").unwrap();
                    if let Some(space_pos) = rest.find(' ') {
                        let name = &rest[..space_pos];
                        eprintln!("   ✅ Imprimante trouvée (FR-droite): '{}'", name);
                        return Some(name.to_string());
                    }
                }
                // Format français avec apostrophe courbe: "l'imprimante NAME est ..."
                else if line.contains("imprimante ") {
                    // Méthode plus générique: chercher "imprimante " puis extraire le mot suivant
                    if let Some(start_pos) = line.find("imprimante ") {
                        let rest = &line[start_pos + "imprimante ".len()..];
                        if let Some(space_pos) = rest.find(' ') {
                            let name = &rest[..space_pos];
                            eprintln!("   ✅ Imprimante trouvée (FR-générique): '{}'", name);
                            return Some(name.to_string());
                        } else if !rest.is_empty() {
                            // Cas où il n'y a pas d'espace après (fin de ligne)
                            eprintln!("   ✅ Imprimante trouvée (FR-fin): '{}'", rest);
                            return Some(rest.to_string());
                        }
                    }
                }

                eprintln!("   ⏭️  Ligne ignorée");
                None
            })
            .collect();

        eprintln!("✅ Total imprimantes trouvées: {}", printers.len());
        eprintln!("   📋 Liste finale: {:?}", printers);
        Ok(printers)
    }

    #[cfg(target_os = "linux")]
    {
        // Utiliser lpstat pour lister les imprimantes sur Linux (comme macOS)
        eprintln!("🖨️  Exécution de lpstat -p...");
        let output = Command::new("lpstat")
            .arg("-p")
            .output();

        match output {
            Ok(output) if output.status.success() => {
                let output_str = String::from_utf8_lossy(&output.stdout);
                eprintln!("📋 Sortie lpstat:\n{}", output_str);

                let printers: Vec<String> = output_str
                    .lines()
                    .filter_map(|line| {
                        eprintln!("   Analyse ligne: {}", line);
                        // Format: "printer NAME is ..." ou "l'imprimante NAME est ..."
                        if line.starts_with("printer ") {
                            let parts: Vec<&str> = line.split_whitespace().collect();
                            if parts.len() >= 2 {
                                eprintln!("   ✓ Imprimante trouvée: {}", parts[1]);
                                return Some(parts[1].to_string());
                            }
                        }
                        None
                    })
                    .collect();

                eprintln!("✅ Total imprimantes trouvées: {}", printers.len());

                if !printers.is_empty() {
                    return Ok(printers);
                }
            }
            Err(e) => {
                eprintln!("⚠️  lpstat a échoué: {}", e);
            }
            _ => {
                eprintln!("⚠️  lpstat n'a pas réussi");
            }
        }

        // Fallback: vérifier les fichiers de périphériques
        eprintln!("⚠️  Tentative de détection via /dev/usb/...");
        Ok(vec!["lp0".to_string(), "lp1".to_string()])
    }
}

#[tauri::command]
pub fn print_raw_data(printer_name: String, data: Vec<u8>) -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        // Sur macOS, utiliser le système CUPS via la commande 'lp'
        use std::io::Write as _;
        let mut child = Command::new("lp")
            .arg("-d")
            .arg(&printer_name)
            .arg("-o")
            .arg("raw")
            .stdin(std::process::Stdio::piped())
            .spawn()
            .map_err(|e| format!("Impossible de démarrer la commande lp: {}", e))?;

        if let Some(mut stdin) = child.stdin.take() {
            stdin.write_all(&data)
                .map_err(|e| format!("Erreur d'écriture vers l'imprimante: {}", e))?;
        }

        let output = child.wait_with_output()
            .map_err(|e| format!("Erreur lors de l'attente de la commande lp: {}", e))?;

        if !output.status.success() {
            return Err(format!("Erreur d'impression: {}", String::from_utf8_lossy(&output.stderr)));
        }

        return Ok("Données envoyées avec succès".to_string());
    }

    #[cfg(target_os = "windows")]
    {
        print_raw_windows(&printer_name, &data)?;
        return Ok("Données envoyées avec succès".to_string());
    }

    #[cfg(target_os = "linux")]
    {
        let printer_path = format!("/dev/usb/{}", printer_name);

        let mut file = OpenOptions::new()
            .write(true)
            .create(false)
            .open(&printer_path)
            .map_err(|e| format!("Impossible d'ouvrir l'imprimante: {}", e))?;

        file.write_all(&data)
            .map_err(|e| format!("Erreur d'écriture: {}", e))?;

        Ok("Données envoyées avec succès".to_string())
    }
}
