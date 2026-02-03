import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, ApiError, gareApi, destinationApi, departureApi, ticketApi } from '../services/api';
import { offlineAgenceApi, offlineDestinationApi, offlineDepartureApi, offlineTicketApi } from '../services/offline-api';
import { invoke } from '@tauri-apps/api/core';
import { useTicketSync } from '../hooks';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  login: string;
  photo: string;
  printerId: number;
  agence: {
    id: number;
    name: string;
    code: string;
    city: string;
    currency: string;
  };
  companyId?: number;
  companyLogo?: string;
  companyName?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  login: (login: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Synchronisation automatique des tickets en arrière-plan
  // Le hook s'exécute automatiquement en arrière-plan, pas besoin d'utiliser son statut
  useTicketSync({
    userId: user ? parseInt(user.id) : null,
    intervalMs: 5 * 60 * 1000, // Synchroniser toutes les 5 minutes
    enabled: isAuthenticated,
    onSuccess: (count) => {
      console.log(`✅ [BACKGROUND SYNC] ${count} tickets synchronisés automatiquement`);
    },
    onError: (error) => {
      console.error('❌ [BACKGROUND SYNC] Erreur de synchronisation:', error);
    },
  });

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté (localStorage)
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('accessToken');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setAccessToken(storedToken);
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (phone: string, password: string) => {
    // Essayer d'abord la connexion locale (offline)
    try {
      console.log('🔐 [AUTH] Tentative de connexion locale...');
      const response = await invoke<{
        user: any;
        agence: any;
        entreprise: any;
      }>('login_offline', { phone, password });

      console.log('✅ [AUTH] Connexion locale réussie:', response);

      const authenticatedUser: User = {
        id: response.user.remote_id?.toString() || response.user.id?.toString() || '0',
        name: response.user.us_nom,
        email: response.user.us_email || phone,
        phone: response.user.us_phone || phone,
        login: phone,
        photo: response.user.us_photo || 'default.png',
        printerId: response.user.us_printer ? parseInt(response.user.us_printer) : 0,
        agence: {
          id: response.agence.remote_id || response.agence.id || 0,
          name: response.agence.ag_nom,
          code: response.agence.ag_code || '',
          city: response.agence.ag_ville || '',
          currency: response.agence.ag_devise || 'FCFA',
        },
        companyId: response.entreprise.remote_id || response.entreprise.id,
        companyLogo: response.entreprise.etp_img_local || response.entreprise.etp_img,
        companyName: response.entreprise.etp_nom,
      };

      setUser(authenticatedUser);
      const tempToken = `token_${response.user.remote_id}_${Date.now()}`;
      setAccessToken(tempToken);
      setIsAuthenticated(true);

      // Stocker les données dans le localStorage
      localStorage.setItem('user', JSON.stringify(authenticatedUser));
      localStorage.setItem('accessToken', tempToken);
      localStorage.setItem('userId', (response.user.remote_id || response.user.id).toString());
      localStorage.setItem('agenceId', (response.agence.remote_id || response.agence.id).toString());

      console.log('✅ [AUTH] Connexion locale réussie, userId:', response.user.remote_id);

      // Synchroniser les données de référence en arrière-plan
      const userId = response.user.remote_id || response.user.id || 0;
      const agenceId = response.agence.remote_id || response.agence.id || 0;
      syncReferenceData(userId, agenceId);

      return; // Sortir si la connexion locale réussit
    } catch (localError) {
      console.warn('⚠️ [AUTH] Connexion locale échouée, tentative en ligne...', localError);
    }

    // Si la connexion locale échoue, essayer l'API en ligne
    try {
      console.log('🔐 [AUTH] Tentative de connexion en ligne...');
      const response = await authApi.login(phone, password);

      const authenticatedUser: User = {
        id: response.usid.toString(),
        name: response.nom,
        email: phone,
        phone: phone,
        login: phone,
        photo: '',
        printerId: 0,
        agence: {
          id: response.agid,
          name: response.agnom,
          code: '',
          city: '',
          currency: 'FCFA',
        },
        companyLogo: response.logo,
        companyName: response.etpnom,
      };

      setUser(authenticatedUser);
      const tempToken = `token_${response.usid}_${Date.now()}`;
      setAccessToken(tempToken);
      setIsAuthenticated(true);

      localStorage.setItem('user', JSON.stringify(authenticatedUser));
      localStorage.setItem('accessToken', tempToken);
      localStorage.setItem('userId', response.usid.toString());
      localStorage.setItem('agenceId', response.agid.toString());

      console.log('✅ [AUTH] Connexion en ligne réussie, userId:', response.usid, 'agenceId:', response.agid);

      syncReferenceData(response.usid, response.agid);
    } catch (error) {
      const apiError = error as ApiError;
      throw new Error(apiError.message || 'Erreur de connexion');
    }
  };

  const syncReferenceData = async (userId: number, agenceId: number) => {
    console.log('📡 [AUTH] Synchronisation des données de référence...');

    // Synchroniser les agences (gares de destination)
    try {
      console.log('📡 [AUTH] Chargement des agences...');
      const agencesResponse = await gareApi.loadGareDest(userId);

      if (agencesResponse.status === 200 && agencesResponse.data) {
        console.log(`📦 [AUTH] ${agencesResponse.data.length} agences reçues de l'API`);
        const count = await offlineAgenceApi.syncFromOnline(agencesResponse.data);
        console.log(`✅ [AUTH] ${count} agences synchronisées en local`);
      } else {
        console.warn('⚠️ [AUTH] Pas d\'agences reçues:', agencesResponse.msg);
      }
    } catch (error) {
      console.error('❌ [AUTH] Erreur sync agences:', error);
      // Ne pas bloquer la connexion si la sync échoue
    }

    // Synchroniser les destinations
    try {
      console.log('📡 [AUTH] Chargement des destinations...');
      const destResponse = await destinationApi.loadDest(agenceId);

      if (destResponse.status === 200 && destResponse.data) {
        console.log(`📦 [AUTH] ${destResponse.data.length} destinations reçues de l'API`);
        const count = await offlineDestinationApi.syncFromOnline(destResponse.data);
        console.log(`✅ [AUTH] ${count} destinations synchronisées en local`);
      } else {
        console.warn('⚠️ [AUTH] Pas de destinations reçues:', destResponse.msg);
      }
    } catch (error) {
      console.error('❌ [AUTH] Erreur sync destinations:', error);
      // Ne pas bloquer la connexion si la sync échoue
    }

    // Synchroniser les départs
    try {
      console.log('📡 [AUTH] Chargement des départs...');
      const departuresResponse = await departureApi.loadAllDepartures(userId);

      if (departuresResponse.status === 200 && departuresResponse.data) {
        console.log(`📦 [AUTH] ${departuresResponse.data.length} départ(s) reçu(s) de l'API`);
        const count = await offlineDepartureApi.syncFromOnline(departuresResponse.data);
        console.log(`✅ [AUTH] ${count} départs synchronisés en local`);
      } else {
        console.warn('⚠️ [AUTH] Pas de départs reçus:', departuresResponse.msg);
      }
    } catch (error) {
      console.error('❌ [AUTH] Erreur sync départs:', error);
      // Ne pas bloquer la connexion si la sync échoue
    }

    // Synchroniser les tickets vendus
    try {
      console.log('📡 [AUTH] Chargement des tickets vendus...');
      const ticketsResponse = await ticketApi.ticketByUser(userId, '', '');

      if (ticketsResponse.status === 200 && ticketsResponse.data) {
        console.log(`📦 [AUTH] ${ticketsResponse.data.length} ticket(s) reçu(s) de l'API`);
        const count = await offlineTicketApi.syncFromOnline(ticketsResponse.data);
        console.log(`✅ [AUTH] ${count} tickets synchronisés en local (sans doublons)`);
      } else {
        console.warn('⚠️ [AUTH] Pas de tickets reçus:', ticketsResponse.msg);
      }
    } catch (error) {
      console.error('❌ [AUTH] Erreur sync tickets:', error);
      // Ne pas bloquer la connexion si la sync échoue
    }

    console.log('✅ [AUTH] Synchronisation des données de référence terminée');
  };

  const register = async (name: string, email: string, _password: string) => {
    // Simuler un appel API pour l'inscription
    const mockUser: User = {
      id: '1',
      name: name,
      email: email,
      phone: '',
      login: email,
      photo: 'default.png',
      printerId: 0,
      agence: {
        id: 0,
        name: '',
        code: '',
        city: '',
        currency: 'FCFA',
      },
    };

    setUser(mockUser);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('roles');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, accessToken, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
