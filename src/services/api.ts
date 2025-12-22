import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { API_CONFIG } from '../config/api.config';

export interface Company {
  id: number;
  code: string;
  sender: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  status: string;
  createdDate: string;
}

export interface Agence {
  id: number;
  code: string;
  name: string;
  phone: string;
  country: string;
  city: string;
  currency: string;
  prefix: string;
  status: string;
  createdDate: string;
  company: Company;
}

export interface Authority {
  authority: string;
}

export interface User {
  accountNonExpired: boolean;
  accountNonLocked: boolean;
  agence: Agence;
  authorities: Authority[];
  bcryptPassword: string;
  code: string;
  connected: boolean;
  createDate: string;
  credentialsNonExpired: boolean;
  deviceToken: string;
  email: string;
  emailVerified: boolean;
  enabled: boolean;
  id: number;
  login: string;
  nom: string;
  password: string;
  phone: string;
  phoneNumberVerified: boolean;
  photo: string;
  printerId: number;
  role: string;
  status: string;
  username: string;
}

export interface LoginResponse {
  status: number;
  nom: string;
  agnom: string;
  usid: number;
  agid: number;
  msg: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface Departure {
  dep_id: number;
  dep_ligne: string | null;
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
  dep_create: string;
  ag_id: number;
  ag_etp: number;
  ag_code: string;
  ag_nom: string;
  ag_phone: string;
  ag_pays: string;
  ag_ville: string;
  ag_devise: string;
  ag_prefix: string;
  ag_stat: string;
  ag_create: string;
  us_id: number;
  us_agence: number;
  us_type: string;
  us_code: string;
  us_nom: string;
  us_email: string;
  us_phone: string;
  us_pass: string;
  us_stat: string;
  us_photo: string;
  us_device: string;
  us_printer: number;
  us_create: string;
  dateDep: string;
  sumtick: number | null;
  agdest: string;
  nbtick: number;
}

export interface LoadAllDepResponse {
  status: number;
  data: Departure[];
  msg: string;
}

export interface Colis {
  dep_id: number;
  dep_ligne: string | null;
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
  dep_create: string;
  exp_id: number;
  exp_user: number;
  exp_type: string;
  exp_depart: string;
  exp_bord: string | null;
  exp_numcar: string;
  exp_colnat: string;
  exp_colval: string;
  exp_frais: string;
  exp_stat: number;
  exp_coldesc: string;
  exp_code: string;
  exp_exp: string;
  exp_phonexp: string;
  exp_dest: string;
  exp_destphone: string;
  exp_agdest: string;
  exp_siege: string | null;
  exp_img: string | null;
  exp_imgret: string | null;
  exp_destdevice: string;
  exp_create: string;
  etp_id: number;
  etp_code: string;
  etp_sender: string;
  etp_nom: string;
  etp_mail: string;
  etp_phone: string;
  etp_pays: string;
  etp_msgbagage: string;
  etp_msgcolis: string;
  etp_pass: string;
  etp_stat: string;
  etp_create: string;
  depDate: string;
  agexp: string;
  agdest: string;
}

export interface ColisByUserResponse {
  status: number;
  data: Colis[];
  msg: string;
}

// Bagage a la même structure que Colis
export type Bagage = Colis;

export interface BagageByUserResponse {
  status: number;
  data: Bagage[];
  msg: string;
}

export interface Ticket {
  tick_id: number;
  tick_vtick: number;
  tick_user: number;
  tick_depart: number;
  tick_price: string;
  tick_reduc: number;
  tick_dest: number;
  tick_nom: string;
  tick_phone: string | null;
  tick_siege: string;
  tick_create: string;
  tick_type: string;
  ag_id: number;
  ag_etp: number;
  ag_code: string | null;
  ag_nom: string;
  ag_phone: string;
  ag_pays: string;
  ag_ville: string;
  ag_devise: string;
  ag_prefix: string;
  ag_stat: string | null;
  ag_create: string;
  dep_id: number;
  dep_ligne: string | null;
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
  dep_create: string;
  etp_id: number;
  etp_code: string;
  etp_sender: string;
  etp_nom: string;
  etp_mail: string;
  etp_phone: string;
  etp_pays: string;
  etp_msgbagage: string;
  etp_msgcolis: string;
  etp_pass: string;
  etp_stat: string;
  etp_create: string;
  etp_img?: string;
  dest_id: number;
  dest_user: number;
  dest_agence: number;
  dest_ville: string;
  dest_price: string;
  dest_create: string;
  depDate: string;
}

export interface TicketByUserResponse {
  status: number;
  data: Ticket[];
  msg: string;
}

export interface Gare {
  ag_id: number;
  ag_etp: number;
  ag_code: string;
  ag_nom: string;
  ag_phone: string;
  ag_pays: string;
  ag_ville: string;
  ag_devise: string;
  ag_prefix: string;
  ag_stat: string;
  ag_create: string;
}

export interface LoadGareDestResponse {
  status: number;
  data: Gare[];
  msg: string;
}

export interface Destination {
  dest_id: number;
  dest_user: number;
  dest_agence: number;
  dest_ville: string;
  dest_price: string;
  dest_create: string;
}

export interface LoadDestResponse {
  status: number;
  data: Destination[];
  msg: string;
}

export interface AddDestinationRequest {
  agid: number;
  destination: string;
  prix: number;
}

export interface AddDestinationResponse {
  status: number;
  msg: string;
}

export interface CreateDepartureRequest {
  user: number;
  dep: string;
  dest: number;
  place: number;
  car: string;
  chauff: string;
  conv: string;
  datedep: string;
  hdep: string;
}

export interface CreateDepartureResponse {
  status: number;
  msg: string;
}

export interface CreateColisRequest {
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
}

export interface CreateColisResponse {
  status: number;
  msg: string;
}

export interface CreateBagageRequest {
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
}

export interface CreateBagageResponse {
  status: number;
  msg: string;
}

export interface SellBilletRequest {
  user: number;
  depart: number;
  dest: number;
  siege: number;
  phone: string;
  voyageur: string;
  price: number;
  method: string;
  reduction: number;
  nature: 'GRATUIT' | 'PAYANT';
}

export interface SellBilletData {
  tick_id?: number;
  tick_vtick?: number;
  tick_user?: number;
  tick_depart?: number;
  tick_price?: string;
  tick_reduc?: number;
  tick_dest?: number;
  tick_nom?: string;
  tick_phone?: string;
  tick_siege?: string;
  tick_nature?: string;
  tick_method?: string;
  tick_create?: string;
  tick_type?: string;
  etp_img?: string;
  etp_nom?: string;
  etp_id?: number;
  [key: string]: any;
}

export interface SellBilletResponse {
  status: number;
  data: SellBilletData[]; // C'est un tableau, pas un objet direct
  msg: string;
}

export const authApi = {
  async login(phone: string, pass: string): Promise<LoginResponse> {
    try {
      console.log('🔐 Tentative de connexion:', { phone, url: `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.login}` });

      const response = await tauriFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.login}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, pass }),
      });

      console.log('📡 Réponse HTTP:', { status: response.status, ok: response.ok, statusText: response.statusText });

      if (!response.ok) {
        throw {
          message: `Erreur de connexion: ${response.statusText}`,
          status: response.status,
        } as ApiError;
      }

      const data = await response.json();
      console.log('📦 Données reçues:', data);

      // Vérifier si la réponse contient un statut d'erreur
      if (data.status !== 200) {
        console.error('❌ Statut d\'erreur dans la réponse:', data.status, data.msg);
        throw {
          message: data.msg || 'Erreur de connexion',
          status: data.status,
        } as ApiError;
      }

      console.log('✅ Connexion réussie!');
      return data as LoginResponse;
    } catch (error: any) {
      console.error('❌ Erreur API complète:', error);
      throw {
        message: error.message || 'Erreur de connexion au serveur',
        status: error.status,
      } as ApiError;
    }
  },
};

export const departureApi = {
  async loadAllDepartures(userId: number): Promise<LoadAllDepResponse> {
    try {
      console.log('🚌 Chargement des départs pour l\'utilisateur:', userId);

      const response = await tauriFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.loadAllDepartures}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user: userId }),
      });

      console.log('📡 Réponse HTTP départs:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        throw {
          message: `Erreur de chargement des départs: ${response.statusText}`,
          status: response.status,
        } as ApiError;
      }

      const data = await response.json();
      console.log('📦 Départs reçus:', data);

      // Vérifier si la réponse contient un statut d'erreur
      if (data.status !== 200) {
        throw {
          message: data.msg || 'Erreur de chargement des départs',
          status: data.status,
        } as ApiError;
      }

      console.log('✅ Départs chargés avec succès:', data.msg);
      return data as LoadAllDepResponse;
    } catch (error: any) {
      console.error('❌ Erreur API départs:', error);
      throw {
        message: error.message || 'Erreur de connexion au serveur',
        status: error.status,
      } as ApiError;
    }
  },

  async createDeparture(request: CreateDepartureRequest): Promise<CreateDepartureResponse> {
    try {
      console.log('➕ Création d\'un nouveau départ:', request);

      const response = await tauriFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.addDepart}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      console.log('📡 Réponse HTTP création départ:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        throw {
          message: `Erreur de création du départ: ${response.statusText}`,
          status: response.status,
        } as ApiError;
      }

      const data = await response.json();
      console.log('📦 Réponse création départ:', data);

      // Vérifier si la réponse contient un statut d'erreur
      if (data.status !== 200) {
        throw {
          message: data.msg || 'Erreur de création du départ',
          status: data.status,
        } as ApiError;
      }

      console.log('✅ Départ créé avec succès:', data.msg);
      return data as CreateDepartureResponse;
    } catch (error: any) {
      console.error('❌ Erreur API création départ:', error);
      throw {
        message: error.message || 'Erreur de connexion au serveur',
        status: error.status,
      } as ApiError;
    }
  },
};

export const colisApi = {
  async colisByUser(userId: number, search: string = '', date: string): Promise<ColisByUserResponse> {
    try {
      console.log('📦 Chargement des colis pour l\'utilisateur:', { userId, search, date });

      const response = await tauriFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.colisByUser}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user: userId, search, date }),
      });

      console.log('📡 Réponse HTTP colis:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        throw {
          message: `Erreur de chargement des colis: ${response.statusText}`,
          status: response.status,
        } as ApiError;
      }

      const data = await response.json();
      console.log('📦 Colis reçus:', data);

      // Vérifier si la réponse contient un statut d'erreur
      if (data.status !== 200) {
        throw {
          message: data.msg || 'Erreur de chargement des colis',
          status: data.status,
        } as ApiError;
      }

      console.log('✅ Colis chargés avec succès:', data.msg);
      return data as ColisByUserResponse;
    } catch (error: any) {
      console.error('❌ Erreur API colis:', error);
      throw {
        message: error.message || 'Erreur de connexion au serveur',
        status: error.status,
      } as ApiError;
    }
  },

  async createColis(request: CreateColisRequest): Promise<CreateColisResponse> {
    try {
      console.log('➕ Création d\'un nouveau colis:', request);

      const response = await tauriFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.createColis}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      console.log('📡 Réponse HTTP création colis:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        throw {
          message: `Erreur de création du colis: ${response.statusText}`,
          status: response.status,
        } as ApiError;
      }

      const data = await response.json();
      console.log('📦 Réponse création colis:', data);

      // Vérifier si la réponse contient un statut d'erreur
      if (data.status !== 200) {
        throw {
          message: data.msg || 'Erreur de création du colis',
          status: data.status,
        } as ApiError;
      }

      console.log('✅ Colis créé avec succès:', data.msg);
      return data as CreateColisResponse;
    } catch (error: any) {
      console.error('❌ Erreur API création colis:', error);
      throw {
        message: error.message || 'Erreur de connexion au serveur',
        status: error.status,
      } as ApiError;
    }
  },
};

export const bagageApi = {
  async bagageByUser(userId: number, search: string = '', date: string): Promise<BagageByUserResponse> {
    try {
      console.log('🎒 Chargement des bagages pour l\'utilisateur:', { userId, search, date });

      const response = await tauriFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.bagageByUser}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user: userId, search, date }),
      });

      console.log('📡 Réponse HTTP bagages:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        throw {
          message: `Erreur de chargement des bagages: ${response.statusText}`,
          status: response.status,
        } as ApiError;
      }

      const data = await response.json();
      console.log('🎒 Bagages reçus:', data);

      // Vérifier si la réponse contient un statut d'erreur
      if (data.status !== 200) {
        throw {
          message: data.msg || 'Erreur de chargement des bagages',
          status: data.status,
        } as ApiError;
      }

      console.log('✅ Bagages chargés avec succès:', data.msg);
      return data as BagageByUserResponse;
    } catch (error: any) {
      console.error('❌ Erreur API bagages:', error);
      throw {
        message: error.message || 'Erreur de connexion au serveur',
        status: error.status,
      } as ApiError;
    }
  },

  async createBagage(request: CreateBagageRequest): Promise<CreateBagageResponse> {
    try {
      console.log('➕ Création d\'un nouveau bagage:', request);

      const response = await tauriFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.createBagage}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      console.log('📡 Réponse HTTP création bagage:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        throw {
          message: `Erreur de création du bagage: ${response.statusText}`,
          status: response.status,
        } as ApiError;
      }

      const data = await response.json();
      console.log('🎒 Réponse création bagage:', data);

      // Vérifier si la réponse contient un statut d'erreur
      if (data.status !== 200) {
        throw {
          message: data.msg || 'Erreur de création du bagage',
          status: data.status,
        } as ApiError;
      }

      console.log('✅ Bagage créé avec succès:', data.msg);
      return data as CreateBagageResponse;
    } catch (error: any) {
      console.error('❌ Erreur API création bagage:', error);
      throw {
        message: error.message || 'Erreur de connexion au serveur',
        status: error.status,
      } as ApiError;
    }
  },
};

export const ticketApi = {
  async ticketByUser(userId: number, search: string = '', date: string): Promise<TicketByUserResponse> {
    try {
      console.log('🎫 Chargement des billets pour l\'utilisateur:', { userId, search, date });

      const response = await tauriFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.ticketByUser}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user: userId, search, date }),
      });

      console.log('📡 Réponse HTTP billets:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        throw {
          message: `Erreur de chargement des billets: ${response.statusText}`,
          status: response.status,
        } as ApiError;
      }

      const data = await response.json();
      console.log('🎫 Billets reçus:', data);

      // Vérifier si la réponse contient un statut d'erreur
      if (data.status !== 200) {
        throw {
          message: data.msg || 'Erreur de chargement des billets',
          status: data.status,
        } as ApiError;
      }

      console.log('✅ Billets chargés avec succès:', data.msg);
      return data as TicketByUserResponse;
    } catch (error: any) {
      console.error('❌ Erreur API billets:', error);
      throw {
        message: error.message || 'Erreur de connexion au serveur',
        status: error.status,
      } as ApiError;
    }
  },

  async sellBillet(request: SellBilletRequest): Promise<SellBilletResponse> {
    try {
      console.log('💳 Vente de billet:', request);

      const response = await tauriFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.sellBillet}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      console.log('📡 Réponse HTTP vente billet:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        throw {
          message: `Erreur de vente du billet: ${response.statusText}`,
          status: response.status,
        } as ApiError;
      }

      const data = await response.json();
      console.log('🎫 Réponse vente billet:', data);
      console.log('🎫 data.data:', data.data);
      console.log('🎫 data.data est un tableau?', Array.isArray(data.data));

      // L'API retourne data comme un tableau
      const firstItem = Array.isArray(data.data) ? data.data[0] : data.data;
      console.log('🎫 Premier élément:', firstItem);
      console.log('🖼️ etp_img présent?', firstItem?.etp_img ? 'OUI' : 'NON');
      if (firstItem?.etp_img) {
        console.log('🖼️ etp_img:', firstItem.etp_img);
      }

      // Vérifier si la réponse contient un statut d'erreur
      if (data.status !== 200) {
        throw {
          message: data.msg || 'Erreur de vente du billet',
          status: data.status,
        } as ApiError;
      }

      console.log('✅ Billet vendu avec succès:', data.msg);
      return data as SellBilletResponse;
    } catch (error: any) {
      console.error('❌ Erreur API vente billet:', error);
      throw {
        message: error.message || 'Erreur de connexion au serveur',
        status: error.status,
      } as ApiError;
    }
  },
};

export const gareApi = {
  async loadGareDest(userId: number): Promise<LoadGareDestResponse> {
    try {
      console.log('🏢 Chargement des gares de destination pour l\'utilisateur:', userId);

      const response = await tauriFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.loadGareDest}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user: userId }),
      });

      console.log('📡 Réponse HTTP gares:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        throw {
          message: `Erreur de chargement des gares: ${response.statusText}`,
          status: response.status,
        } as ApiError;
      }

      const data = await response.json();
      console.log('🏢 Gares reçues:', data);

      // Vérifier si la réponse contient un statut d'erreur
      if (data.status !== 200) {
        throw {
          message: data.msg || 'Erreur de chargement des gares',
          status: data.status,
        } as ApiError;
      }

      console.log('✅ Gares chargées avec succès:', data.msg);
      return data as LoadGareDestResponse;
    } catch (error: any) {
      console.error('❌ Erreur API gares:', error);
      throw {
        message: error.message || 'Erreur de connexion au serveur',
        status: error.status,
      } as ApiError;
    }
  },
};

export const destinationApi = {
  async loadDest(agenceId: number): Promise<LoadDestResponse> {
    try {
      console.log('📍 Chargement des destinations pour l\'agence:', agenceId);

      const response = await tauriFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.loadDest}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agid: agenceId }),
      });

      console.log('📡 Réponse HTTP destinations:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        throw {
          message: `Erreur de chargement des destinations: ${response.statusText}`,
          status: response.status,
        } as ApiError;
      }

      const data = await response.json();
      console.log('📍 Destinations reçues:', data);

      // Vérifier si la réponse contient un statut d'erreur
      if (data.status !== 200) {
        throw {
          message: data.msg || 'Erreur de chargement des destinations',
          status: data.status,
        } as ApiError;
      }

      console.log('✅ Destinations chargées avec succès:', data.msg);
      return data as LoadDestResponse;
    } catch (error: any) {
      console.error('❌ Erreur API destinations:', error);
      throw {
        message: error.message || 'Erreur de connexion au serveur',
        status: error.status,
      } as ApiError;
    }
  },

  async addDestination(request: AddDestinationRequest): Promise<AddDestinationResponse> {
    try {
      console.log('➕ Ajout d\'une nouvelle destination:', request);

      const response = await tauriFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.addDestination}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      console.log('📡 Réponse HTTP ajout destination:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        throw {
          message: `Erreur d'ajout de la destination: ${response.statusText}`,
          status: response.status,
        } as ApiError;
      }

      const data = await response.json();
      console.log('📍 Réponse ajout destination:', data);

      // Vérifier si la réponse contient un statut d'erreur
      if (data.status !== 200) {
        throw {
          message: data.msg || 'Erreur d\'ajout de la destination',
          status: data.status,
        } as ApiError;
      }

      console.log('✅ Destination ajoutée avec succès:', data.msg);
      return data as AddDestinationResponse;
    } catch (error: any) {
      console.error('❌ Erreur API ajout destination:', error);
      throw {
        message: error.message || 'Erreur de connexion au serveur',
        status: error.status,
      } as ApiError;
    }
  },
};

export interface Siege {
  siege: string;
  stat: number;
  price: string;
}

export interface DisplaySiegeResponse {
  status: number;
  data: Siege[];
  msg: string;
}

export const siegeApi = {
  async displaySiege(departId: number): Promise<DisplaySiegeResponse> {
    try {
      console.log('💺 Chargement des sièges pour le départ:', departId);

      const response = await tauriFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.displaySiege}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ depart: departId }),
      });

      console.log('📡 Réponse HTTP sièges:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        throw {
          message: `Erreur de chargement des sièges: ${response.statusText}`,
          status: response.status,
        } as ApiError;
      }

      const data = await response.json();
      console.log('💺 Sièges reçus:', data);

      // Vérifier si la réponse contient un statut d'erreur
      if (data.status !== 200) {
        throw {
          message: data.msg || 'Erreur de chargement des sièges',
          status: data.status,
        } as ApiError;
      }

      console.log('✅ Sièges chargés avec succès:', data.msg);
      return data as DisplaySiegeResponse;
    } catch (error: any) {
      console.error('❌ Erreur API sièges:', error);
      throw {
        message: error.message || 'Erreur de connexion au serveur',
        status: error.status,
      } as ApiError;
    }
  },
};

export interface StatTicket {
  totaltick: number;
  nbtick: number;
  dest_id: number;
  dest_user: number;
  dest_agence: number;
  dest_ville: string;
  dest_price: string;
  dest_create: string;
}

export interface DashboardData {
  cptcolis: number;
  caisse: number;
  cptbag: number;
  colcais: number | null;
  bagcais: number | null;
  statcolis: any[];
  statticket: StatTicket[];
  statbagage: any[];
  nbtick: number;
  totaltick: number;
}

export interface DashboardResponse {
  status: number;
  message: string;
  data: DashboardData;
}

export interface DashboardRequest {
  debut: string;
  fin: string;
  user: number;
}

export const dashboardApi = {
  async getDashboard(request: DashboardRequest): Promise<DashboardResponse> {
    try {
      console.log('📊 Chargement des données du dashboard:', request);

      const response = await tauriFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.dashboard}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      console.log('📡 Réponse HTTP dashboard:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        throw {
          message: `Erreur de chargement du dashboard: ${response.statusText}`,
          status: response.status,
        } as ApiError;
      }

      const data = await response.json();
      console.log('📊 Dashboard reçu:', data);

      // Vérifier si la réponse contient un statut d'erreur
      if (data.status !== 200) {
        throw {
          message: data.message || 'Erreur de chargement du dashboard',
          status: data.status,
        } as ApiError;
      }

      console.log('✅ Dashboard chargé avec succès:', data.message);
      return data as DashboardResponse;
    } catch (error: any) {
      console.error('❌ Erreur API dashboard:', error);
      throw {
        message: error.message || 'Erreur de connexion au serveur',
        status: error.status,
      } as ApiError;
    }
  },
};

export interface BordereauTicket {
  tick_id: number;
  tick_vtick: number;
  tick_user: number;
  tick_depart: number;
  tick_price: string;
  tick_reduc: number;
  tick_dest: number;
  tick_nom: string;
  tick_phone: string | null;
  tick_siege: string;
  tick_nature: string;
  tick_method: string;
  tick_create: string;
  tick_type: string;
  dest_ville: string;
  [key: string]: any;
}

export interface BordereauDestination {
  dest_id: number;
  dest_ville: string;
  dest_price: string;
  nbtick: number;
  amount: number;
  [key: string]: any;
}

export interface BordereauDepart {
  dep_id: number;
  dep_numcar: string;
  dep_nom: string;
  dep_place: number;
  dep_chauff: string;
  dep_date: string;
  dep_heure: string;
  ag_nom: string;
  agdest: string;
  etp_img: string;
  [key: string]: any;
}

export interface BordereauStatTicket {
  tot_ticket: number;
  nbtick: number;
}

export interface BordereauBilletData {
  cptcolis: number;
  tickets: BordereauTicket[];
  stattick: BordereauStatTicket;
  cptbag: number;
  billet: BordereauDestination[];
  depart: BordereauDepart[];
  cptick: number;
}

export interface BordereauBilletResponse {
  status: number;
  message: string;
  data: BordereauBilletData;
}

export interface BordereauColisItem {
  exp_id: number;
  exp_code: string;
  exp_coldesc: string;
  exp_frais: string;
  exp_exp: string;
  exp_dest: string;
  ag_nom: string;
  [key: string]: any;
}

export interface BordereauColisDepart {
  dep_id: number;
  dep_numcar: string;
  dep_nom: string;
  dep_place: number;
  dep_chauff: string;
  dep_date: string;
  dep_heure: string;
  ag_nom: string;
  etp_img: string;
  [key: string]: any;
}

export interface BordereauColisData {
  cptcolis: number;
  cptbag: number;
  colis: BordereauColisItem[];
  depart: BordereauColisDepart[];
}

export interface BordereauColisResponse {
  status: number;
  message: string;
  data: BordereauColisData;
}

export interface BordereauBagageItem {
  exp_id: number;
  exp_code: string;
  exp_coldesc: string;
  exp_frais: string;
  exp_exp: string;
  [key: string]: any;
}

export interface BordereauBagageDepart {
  dep_id: number;
  dep_numcar: string;
  dep_nom: string;
  dep_place: number;
  dep_chauff: string;
  dep_date: string;
  dep_heure: string;
  ag_nom: string;
  etp_img: string;
  [key: string]: any;
}

export interface BordereauBagageData {
  cptcolis: number;
  cptbag: number;
  bagage: BordereauBagageItem[];
  depart: BordereauBagageDepart[];
  cptick: number;
}

export interface BordereauBagageResponse {
  status: number;
  message: string;
  data: BordereauBagageData;
}

export const bordereauApi = {
  async getBordBillet(userId: number, agenceId: number, departId: number): Promise<BordereauBilletResponse> {
    try {
      console.log('📋 Chargement du bordereau billet:', { userId, agenceId, departId });

      const response = await tauriFetch(
        `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.bordBillet}?user=${userId}&agid=${agenceId}&depart=${departId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('📡 Réponse HTTP bordereau billet:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        throw {
          message: `Erreur de chargement du bordereau: ${response.statusText}`,
          status: response.status,
        } as ApiError;
      }

      const data = await response.json();
      console.log('📋 Bordereau billet reçu:', data);

      // Vérifier si la réponse contient un statut d'erreur
      if (data.status !== 200) {
        throw {
          message: data.message || 'Erreur de chargement du bordereau',
          status: data.status,
        } as ApiError;
      }

      console.log('✅ Bordereau billet chargé avec succès:', data.message);
      return data as BordereauBilletResponse;
    } catch (error: any) {
      console.error('❌ Erreur API bordereau billet:', error);
      throw {
        message: error.message || 'Erreur de connexion au serveur',
        status: error.status,
      } as ApiError;
    }
  },

  async getBordColis(userId: number, agenceId: number, departId: number): Promise<BordereauColisResponse> {
    try {
      console.log('📋 Chargement du bordereau colis:', { userId, agenceId, departId });

      const response = await tauriFetch(
        `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.bordColis}?user=${userId}&agid=${agenceId}&depart=${departId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('📡 Réponse HTTP bordereau colis:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        throw {
          message: `Erreur de chargement du bordereau colis: ${response.statusText}`,
          status: response.status,
        } as ApiError;
      }

      const data = await response.json();
      console.log('📋 Bordereau colis reçu:', data);

      // Vérifier si la réponse contient un statut d'erreur
      if (data.status !== 200) {
        throw {
          message: data.message || 'Erreur de chargement du bordereau colis',
          status: data.status,
        } as ApiError;
      }

      console.log('✅ Bordereau colis chargé avec succès:', data.message);
      return data as BordereauColisResponse;
    } catch (error: any) {
      console.error('❌ Erreur API bordereau colis:', error);
      throw {
        message: error.message || 'Erreur de connexion au serveur',
        status: error.status,
      } as ApiError;
    }
  },

  async getBordBagage(userId: number, agenceId: number, departId: number): Promise<BordereauBagageResponse> {
    try {
      console.log('📋 Chargement du bordereau bagage:', { userId, agenceId, departId });

      const response = await tauriFetch(
        `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.bordBagage}?user=${userId}&agid=${agenceId}&depart=${departId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('📡 Réponse HTTP bordereau bagage:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        throw {
          message: `Erreur de chargement du bordereau bagage: ${response.statusText}`,
          status: response.status,
        } as ApiError;
      }

      const data = await response.json();
      console.log('📋 Bordereau bagage reçu:', data);

      // Vérifier si la réponse contient un statut d'erreur
      if (data.status !== 200) {
        throw {
          message: data.message || 'Erreur de chargement du bordereau bagage',
          status: data.status,
        } as ApiError;
      }

      console.log('✅ Bordereau bagage chargé avec succès:', data.message);
      return data as BordereauBagageResponse;
    } catch (error: any) {
      console.error('❌ Erreur API bordereau bagage:', error);
      throw {
        message: error.message || 'Erreur de connexion au serveur',
        status: error.status,
      } as ApiError;
    }
  },
};
