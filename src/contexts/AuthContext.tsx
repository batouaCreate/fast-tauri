import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, ApiError, gareApi, destinationApi, departureApi } from '../services/api';
import { offlineAgenceApi, offlineDestinationApi, offlineDepartureApi } from '../services/offline-api';

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
    try {
      console.log('🔐 [AUTH] Tentative de connexion...');
      const response = await authApi.login(phone, password);

      const authenticatedUser: User = {
        id: response.usid.toString(),
        name: response.nom,
        email: phone, // L'API ne retourne pas l'email, on utilise le téléphone
        phone: phone, // Le numéro de téléphone
        login: phone,
        photo: '', // L'API ne retourne pas de photo
        printerId: 0, // L'API ne retourne pas de printerId
        agence: {
          id: response.agid,
          name: response.agnom,
          code: '', // L'API ne retourne pas le code
          city: '', // L'API ne retourne pas la ville
          currency: 'FCFA', // Valeur par défaut
        },
      };

      setUser(authenticatedUser);
      // L'API ne retourne pas de token, on utilise une valeur temporaire
      const tempToken = `token_${response.usid}_${Date.now()}`;
      setAccessToken(tempToken);
      setIsAuthenticated(true);

      // Stocker les données dans le localStorage
      localStorage.setItem('user', JSON.stringify(authenticatedUser));
      localStorage.setItem('accessToken', tempToken);
      localStorage.setItem('userId', response.usid.toString());
      localStorage.setItem('agenceId', response.agid.toString());

      console.log('✅ [AUTH] Connexion réussie, userId:', response.usid, 'agenceId:', response.agid);

      // Synchroniser les données de référence en arrière-plan
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
