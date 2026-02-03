import { invoke } from '@tauri-apps/api/core';

// Types pour les requêtes et réponses offline
export interface OfflineDeparture {
  id?: number;
  remote_id?: number;
  dep_ligne?: string;
  dep_user: number;
  dep_numcar: string;
  dep_nom: string;
  dep_dest: string;
  dep_place: number;
  dep_chauff: string;
  dep_conv: string;
  dep_date: string;
  dep_heure: string;
  dep_fraisroute: number;
  dep_lavage: number;
  dep_carbur: number;
  dep_droitgare: number;
  dep_autredep: number;
  ag_id: number;
  created_at: string;
  updated_at: string;
  sync_status: string;
  last_sync_attempt?: string;
  sync_error?: string;
}

export interface OfflineTicket {
  id?: number;
  remote_id?: number;
  tick_vtick?: number;
  tick_user: number;
  tick_depart: number;
  tick_price: string;
  tick_reduc: number;
  tick_dest: number;
  tick_nom: string;
  tick_phone?: string;
  tick_siege: string;
  tick_nature: string;
  tick_method: string;
  tick_type?: string;
  created_at: string;
  updated_at: string;
  sync_status: string;
  last_sync_attempt?: string;
  sync_error?: string;
}

export interface OfflineColis {
  id?: number;
  remote_id?: number;
  exp_user: number;
  exp_type: string;
  exp_depart: number;
  exp_bord?: string;
  exp_numcar: string;
  exp_colnat: string;
  exp_colval: string;
  exp_frais: string;
  exp_stat: number;
  exp_coldesc: string;
  exp_code?: string;
  exp_exp: string;
  exp_phonexp: string;
  exp_dest: string;
  exp_destphone: string;
  exp_agdest: string;
  exp_siege?: string;
  exp_img?: string;
  exp_imgret?: string;
  exp_destdevice?: string;
  created_at: string;
  updated_at: string;
  sync_status: string;
  last_sync_attempt?: string;
  sync_error?: string;
}

export interface OfflineBagage {
  id?: number;
  remote_id?: number;
  exp_user: number;
  exp_type: string;
  exp_depart: number;
  exp_bord?: string;
  exp_numcar: string;
  exp_colnat: string;
  exp_colval: string;
  exp_frais: string;
  exp_stat: number;
  exp_coldesc: string;
  exp_code?: string;
  exp_exp: string;
  exp_phonexp: string;
  exp_dest: number;
  exp_siege: string;
  exp_img?: string;
  exp_imgret?: string;
  created_at: string;
  updated_at: string;
  sync_status: string;
  last_sync_attempt?: string;
  sync_error?: string;
}

export interface OfflineAgence {
  id?: number;
  remote_id?: number;
  ag_code?: string;
  ag_nom: string;
  ag_phone?: string;
  ag_pays?: string;
  ag_ville?: string;
  ag_devise?: string;
  ag_prefix?: string;
  ag_stat?: string;
  ag_etp?: number;
  created_at: string;
  updated_at: string;
}

export interface OfflineDestination {
  id?: number;
  remote_id?: number;
  dest_user: number;
  dest_agence: number;
  dest_ville: string;
  dest_price: string;
  created_at: string;
  updated_at: string;
}

export interface SyncStatus {
  pending_departures: number;
  pending_tickets: number;
  error_departures: number;
  error_tickets: number;
}

export interface TicketStats {
  count: number;
  total: number;
}

// API pour les départs
export const offlineDepartureApi = {
  async syncFromOnline(departuresData: any[]): Promise<number> {
    try {
      console.log('🔌 Synchronisation départs vers la BD locale:', departuresData.length);
      const count = await invoke<number>('sync_departures', {
        departuresJson: JSON.stringify(departuresData),
      });
      console.log('✅ Départs synchronisés:', count);
      return count;
    } catch (error) {
      console.error('❌ Erreur sync départs:', error);
      throw error;
    }
  },

  async create(request: {
    user: number;
    dep: string;
    dest: number;
    place: number;
    car: string;
    chauff: string;
    conv: string;
    datedep: string;
    hdep: string;
  }, agId: number): Promise<OfflineDeparture> {
    try {
      console.log('🔌 Création départ offline:', request);
      const departure = await invoke<OfflineDeparture>('create_departure_offline', {
        request,
        agId,
      });
      console.log('✅ Départ créé offline:', departure);
      return departure;
    } catch (error) {
      console.error('❌ Erreur création départ offline:', error);
      throw error;
    }
  },

  async getAll(userId: number): Promise<OfflineDeparture[]> {
    try {
      console.log('🔌 Chargement départs offline pour utilisateur:', userId);
      const departures = await invoke<OfflineDeparture[]>('get_all_departures_offline', {
        userId,
      });
      console.log('✅ Départs chargés offline:', departures.length);
      return departures;
    } catch (error) {
      console.error('❌ Erreur chargement départs offline:', error);
      throw error;
    }
  },

  async getById(id: number): Promise<OfflineDeparture> {
    try {
      const departure = await invoke<OfflineDeparture>('get_departure_by_id_offline', { id });
      return departure;
    } catch (error) {
      console.error('❌ Erreur chargement départ offline:', error);
      throw error;
    }
  },
};

// API pour les tickets
export const offlineTicketApi = {
  async syncFromOnline(ticketsData: any[]): Promise<number> {
    try {
      console.log('🔌 Synchronisation tickets vers la BD locale:', ticketsData.length);
      const count = await invoke<number>('sync_tickets', {
        ticketsJson: JSON.stringify(ticketsData),
      });
      console.log('✅ Tickets synchronisés (sans doublons):', count);
      return count;
    } catch (error) {
      console.error('❌ Erreur sync tickets:', error);
      throw error;
    }
  },

  async sell(request: {
    user: number;
    depart: number;
    dest: number;
    siege: number;
    phone: string;
    voyageur: string;
    price: number;
    method: string;
    reduction: number;
    nature: string;
  }): Promise<OfflineTicket> {
    try {
      console.log('🔌 Vente ticket offline:', request);
      const ticket = await invoke<OfflineTicket>('sell_ticket_offline', { request });
      console.log('✅ Ticket vendu offline:', ticket);
      return ticket;
    } catch (error) {
      console.error('❌ Erreur vente ticket offline:', error);
      throw error;
    }
  },

  async getAll(userId: number): Promise<OfflineTicket[]> {
    try {
      console.log('🔌 Chargement tickets offline pour utilisateur:', userId);
      const tickets = await invoke<OfflineTicket[]>('get_all_tickets_offline', { userId });
      console.log('✅ Tickets chargés offline:', tickets.length);
      return tickets;
    } catch (error) {
      console.error('❌ Erreur chargement tickets offline:', error);
      throw error;
    }
  },

  async getByDeparture(departureId: number): Promise<OfflineTicket[]> {
    try {
      const tickets = await invoke<OfflineTicket[]>('get_tickets_by_departure_offline', {
        departureId,
      });
      return tickets;
    } catch (error) {
      console.error('❌ Erreur chargement tickets par départ offline:', error);
      throw error;
    }
  },

  async getById(id: number): Promise<OfflineTicket> {
    try {
      const ticket = await invoke<OfflineTicket>('get_ticket_by_id_offline', { id });
      return ticket;
    } catch (error) {
      console.error('❌ Erreur chargement ticket offline:', error);
      throw error;
    }
  },

  async getStatistics(userId: number, startDate: string, endDate: string): Promise<TicketStats> {
    try {
      console.log('🔌 Récupération stats tickets offline:', { userId, startDate, endDate });
      const stats = await invoke<TicketStats>('get_ticket_statistics', {
        userId,
        startDate,
        endDate,
      });
      console.log('✅ Stats tickets récupérées:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Erreur récupération stats tickets:', error);
      throw error;
    }
  },
};

// API pour les colis
export const offlineColisApi = {
  async create(request: {
    user: number;
    depart: number;
    nature: string;
    frais: number;
    desc: string;
    valeur: number;
    exp: string;
    phonexp: string;
    benef: string;
    phonedest: string;
    agdest: number;
  }, numcar: string): Promise<OfflineColis> {
    try {
      console.log('🔌 Création colis offline:', request);
      const colis = await invoke<OfflineColis>('create_colis_offline', { request, numcar });
      console.log('✅ Colis créé offline:', colis);
      return colis;
    } catch (error) {
      console.error('❌ Erreur création colis offline:', error);
      throw error;
    }
  },

  async getById(id: number): Promise<OfflineColis> {
    try {
      const colis = await invoke<OfflineColis>('get_colis_by_id_offline', { id });
      return colis;
    } catch (error) {
      console.error('❌ Erreur chargement colis offline:', error);
      throw error;
    }
  },
};

// API pour les bagages
export const offlineBagageApi = {
  async create(request: {
    user: number;
    depart: number;
    nature: string;
    frais: number;
    desc: string;
    valeur: number;
    exp: string;
    phonexp: string;
    siege: number;
    dest: number;
  }, numcar: string): Promise<OfflineBagage> {
    try {
      console.log('🔌 Création bagage offline:', request);
      const bagage = await invoke<OfflineBagage>('create_bagage_offline', { request, numcar });
      console.log('✅ Bagage créé offline:', bagage);
      return bagage;
    } catch (error) {
      console.error('❌ Erreur création bagage offline:', error);
      throw error;
    }
  },

  async getById(id: number): Promise<OfflineBagage> {
    try {
      const bagage = await invoke<OfflineBagage>('get_bagage_by_id_offline', { id });
      return bagage;
    } catch (error) {
      console.error('❌ Erreur chargement bagage offline:', error);
      throw error;
    }
  },
};

// API pour les agences
export const offlineAgenceApi = {
  async syncFromOnline(agencesData: any[]): Promise<number> {
    try {
      console.log('🔌 Synchronisation agences vers la BD locale:', agencesData.length);
      const count = await invoke<number>('sync_agences', {
        agencesJson: JSON.stringify(agencesData),
      });
      console.log('✅ Agences synchronisées:', count);
      return count;
    } catch (error) {
      console.error('❌ Erreur sync agences:', error);
      throw error;
    }
  },

  async getAll(): Promise<OfflineAgence[]> {
    try {
      const agences = await invoke<OfflineAgence[]>('get_all_agences_offline');
      return agences;
    } catch (error) {
      console.error('❌ Erreur récupération agences:', error);
      throw error;
    }
  },

  async getByEntreprise(etpId: number): Promise<OfflineAgence[]> {
    try {
      console.log('🔌 Récupération agences pour entreprise:', etpId);
      const agences = await invoke<OfflineAgence[]>('get_agences_by_entreprise_offline', {
        etpId,
      });
      console.log('✅ Agences filtrées pour entreprise:', agences.length);
      return agences;
    } catch (error) {
      console.error('❌ Erreur récupération agences par entreprise:', error);
      throw error;
    }
  },
};

// API pour les destinations
export const offlineDestinationApi = {
  async syncFromOnline(destinationsData: any[]): Promise<number> {
    try {
      console.log('🔌 Synchronisation destinations vers la BD locale:', destinationsData.length);
      const count = await invoke<number>('sync_destinations', {
        destinationsJson: JSON.stringify(destinationsData),
      });
      console.log('✅ Destinations synchronisées:', count);
      return count;
    } catch (error) {
      console.error('❌ Erreur sync destinations:', error);
      throw error;
    }
  },

  async getAll(): Promise<OfflineDestination[]> {
    try {
      const destinations = await invoke<OfflineDestination[]>('get_all_destinations_offline');
      return destinations;
    } catch (error) {
      console.error('❌ Erreur récupération destinations:', error);
      throw error;
    }
  },

  async getByAgence(agenceId: number): Promise<OfflineDestination[]> {
    try {
      const destinations = await invoke<OfflineDestination[]>('get_destinations_by_agence_offline', {
        agenceId,
      });
      return destinations;
    } catch (error) {
      console.error('❌ Erreur récupération destinations par agence:', error);
      throw error;
    }
  },
};

// API pour le statut de synchronisation
export const syncApi = {
  async getStatus(): Promise<SyncStatus> {
    try {
      const status = await invoke<SyncStatus>('get_sync_status');
      return status;
    } catch (error) {
      console.error('❌ Erreur récupération statut sync:', error);
      throw error;
    }
  },

  async forceSync(): Promise<string> {
    try {
      console.log('🔄 Forçage de la synchronisation...');
      const result = await invoke<string>('force_sync');
      console.log('✅ Synchronisation forcée:', result);
      return result;
    } catch (error) {
      console.error('❌ Erreur forçage sync:', error);
      throw error;
    }
  },
};

// API de diagnostic
export const diagnosticApi = {
  async getDbInfo(): Promise<string> {
    try {
      console.log('🔍 [DIAGNOSTIC] Récupération des infos BD...');
      const info = await invoke<string>('get_db_info');
      console.log(info);
      return info;
    } catch (error) {
      console.error('❌ Erreur diagnostic:', error);
      throw error;
    }
  },
};
