import { invoke } from '@tauri-apps/api/core';
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';

export interface TicketItem {
  label: string;
  value: string;
}

export interface TicketData {
  title: string;
  items: TicketItem[];
  total: string;
  footer: string[];
}

export class ThermalPrinter {
  /**
   * Liste les imprimantes disponibles
   */
  static async listPrinters(): Promise<string[]> {
    try {
      return await invoke<string[]>('list_printers');
    } catch (error) {
      console.error('Erreur lors de la récupération des imprimantes:', error);
      throw error;
    }
  }

  /**
   * Imprime un ticket avec un logo optionnel
   * @param printerName - Nom de l'imprimante (ex: "USB001", "lp0", "thermal_printer")
   * @param ticketData - Données du ticket
   * @param logoBase64 - Logo en base64 (optionnel)
   * @param logoWidth - Largeur du logo en pixels (optionnel, 200 par défaut)
   */
  static async printTicket(
    printerName: string,
    ticketData: TicketData,
    logoBase64?: string,
    logoWidth?: number
  ): Promise<string> {
    try {
      return await invoke<string>('print_ticket', {
        printerName,
        ticketData,
        logoBase64: logoBase64 || null,
        logoWidth: logoWidth || null,
      });
    } catch (error) {
      console.error('Erreur lors de l\'impression:', error);
      throw error;
    }
  }

  /**
   * Imprime une souche et un ticket ensemble (en une seule opération)
   * @param printerName - Nom de l'imprimante
   * @param ticketData - Données du ticket
   * @param logoBase64 - Logo en base64 (optionnel)
   */
  static async printStubAndTicket(
    printerName: string,
    ticketData: TicketData,
    logoBase64?: string
  ): Promise<string> {
    try {
      return await invoke<string>('print_stub_and_ticket', {
        printerName,
        ticketData,
        logoBase64: logoBase64 || null,
      });
    } catch (error) {
      console.error('Erreur lors de l\'impression souche et ticket:', error);
      throw error;
    }
  }

  /**
   * Convertit une image en base64
   * @param file - Fichier image
   */
  static async imageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Extraire seulement la partie base64 (sans le préfixe data:image/...)
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Convertit une URL d'image en base64
   * @param url - URL de l'image
   */
  static async urlToBase64(url: string): Promise<string> {
    console.log('🌐 Téléchargement de l\'image depuis:', url);

    // Utiliser le fetch de Tauri pour éviter les problèmes CORS
    const response = await tauriFetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
    }

    console.log('✅ Image téléchargée, conversion en blob...');
    const blob = await response.blob();
    console.log('✅ Blob créé, taille:', blob.size, 'octets');

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Extraire seulement la partie base64 (sans le préfixe data:image/...)
        const base64 = result.split(',')[1];
        console.log('✅ Conversion en base64 terminée, taille:', base64.length, 'caractères');
        resolve(base64);
      };
      reader.onerror = (error) => {
        console.error('❌ Erreur lors de la conversion en base64:', error);
        reject(error);
      };
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Envoie des données brutes à l'imprimante
   * @param printerName - Nom de l'imprimante
   * @param data - Données brutes (commandes ESC/POS)
   */
  static async printRawData(printerName: string, data: number[]): Promise<string> {
    try {
      return await invoke<string>('print_raw_data', {
        printerName,
        data,
      });
    } catch (error) {
      console.error('Erreur lors de l\'impression des données brutes:', error);
      throw error;
    }
  }
}

/**
 * Helper pour créer des tickets de différents types
 */
export class TicketBuilder {
  /**
   * Crée un ticket de transport
   */
  static createTransportTicket(data: {
    ticketNumber: string;
    departure: string;
    date: string;
    time: string;
    departureStation: string;
    destination: string;
    seatNumber: string;
    price: string;
    passenger?: string;
    isGratuit?: boolean;
    companyName?: string;
  }): TicketData {
    // Construire le titre avec le nom de l'entreprise si fourni
    const title = data.companyName ? data.companyName : 'TICKET DE TRANSPORT';

    return {
      title,
      items: [
        { label: 'Num Ticket', value: data.ticketNumber },
        { label: 'Depart', value: data.departure },
        { label: 'Date', value: data.date },
        { label: 'Heure', value: data.time },
        { label: 'Gare depart', value: data.departureStation },
        { label: 'Destination', value: data.destination },
        { label: 'Siege', value: data.seatNumber },
        { label: 'Prix', value: data.price },
      ],
      // Si c'est gratuit, afficher "GRATUIT" au lieu du total
      total: data.isGratuit ? 'GRATUIT' : `TOTAL: ${data.price}`,
      footer: [
        'Merci de votre confiance',
        'Bon voyage!',
      ],
    };
  }

  /**
   * Crée un reçu de colis
   */
  static createParcelReceipt(data: {
    trackingNumber: string;
    sender: string;
    recipient: string;
    destination: string;
    weight: string;
    price: string;
  }): TicketData {
    return {
      title: 'RECU COLIS',
      items: [
        { label: 'N° Suivi', value: data.trackingNumber },
        { label: 'Expéditeur', value: data.sender },
        { label: 'Destinataire', value: data.recipient },
        { label: 'Destination', value: data.destination },
        { label: 'Poids', value: data.weight },
      ],
      total: `MONTANT: ${data.price}`,
      footer: [
        'Conservez ce reçu',
        'Livraison sous 24-48h',
        new Date().toLocaleString('fr-FR'),
      ],
    };
  }

  /**
   * Crée un bordereau
   */
  static createManifest(data: {
    manifestNumber: string;
    driver: string;
    vehicle: string;
    destination: string;
    items: Array<{ description: string; quantity: string }>;
  }): TicketData {
    const items: TicketItem[] = [
      { label: 'N° Bordereau', value: data.manifestNumber },
      { label: 'Chauffeur', value: data.driver },
      { label: 'Véhicule', value: data.vehicle },
      { label: 'Destination', value: data.destination },
      { label: '', value: '' },
      { label: '--- CONTENU ---', value: '' },
    ];

    data.items.forEach((item, index) => {
      items.push({
        label: `${index + 1}. ${item.description}`,
        value: `x${item.quantity}`,
      });
    });

    return {
      title: 'BORDEREAU',
      items,
      total: `TOTAL ARTICLES: ${data.items.length}`,
      footer: [
        'Signature: _____________',
        new Date().toLocaleString('fr-FR'),
      ],
    };
  }
}
