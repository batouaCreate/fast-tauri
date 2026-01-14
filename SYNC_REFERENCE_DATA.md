# Synchronisation des Données de Référence

## Vue d'ensemble

Après la connexion de l'utilisateur, il est nécessaire de charger les **agences** (gares de destination) et les **destinations** (avec leurs prix) dans la base de données locale pour permettre :

1. La création de départs (sélection de l'agence de destination)
2. La vente de billets (sélection de la destination)

Ces données sont chargées **UNE SEULE FOIS** après la connexion et mises à jour si nécessaire. Le système utilise `INSERT OR REPLACE` pour éviter les doublons.

## Implémentation

### 1. Après la connexion réussie

Dans votre composant de connexion (Login.tsx ou AuthContext.tsx), ajoutez la synchronisation après le login :

```typescript
import { gareApi, destinationApi } from './services/api';
import { offlineAgenceApi, offlineDestinationApi } from './services/offline-api';

const handleLogin = async (phone: string, password: string) => {
  try {
    // 1. Connexion à l'API
    const loginResponse = await authApi.login(phone, password);

    if (loginResponse.status === 200) {
      // Sauvegarder les infos utilisateur
      setUser({
        usid: loginResponse.usid,
        agid: loginResponse.agid,
        nom: loginResponse.nom,
        agnom: loginResponse.agnom,
      });

      // 2. Charger les agences de destination
      await syncAgences(loginResponse.usid);

      // 3. Charger les destinations pour l'agence
      await syncDestinations(loginResponse.agid);

      // 4. Rediriger vers le dashboard
      navigate('/dashboard');
    }
  } catch (error) {
    console.error('Erreur de connexion:', error);
  }
};

const syncAgences = async (userId: number) => {
  try {
    console.log('📡 Chargement des agences depuis l\'API...');

    // Charger depuis l'API en ligne
    const response = await gareApi.loadGareDest(userId);

    if (response.status === 200 && response.data) {
      // Synchroniser dans la BD locale
      const count = await offlineAgenceApi.syncFromOnline(response.data);
      console.log(`✅ ${count} agences synchronisées`);
    }
  } catch (error) {
    console.warn('⚠️ Impossible de charger les agences (mode offline)');
    // L'application continue de fonctionner avec les données locales existantes
  }
};

const syncDestinations = async (agenceId: number) => {
  try {
    console.log('📡 Chargement des destinations depuis l\'API...');

    // Charger depuis l'API en ligne
    const response = await destinationApi.loadDest(agenceId);

    if (response.status === 200 && response.data) {
      // Synchroniser dans la BD locale
      const count = await offlineDestinationApi.syncFromOnline(response.data);
      console.log(`✅ ${count} destinations synchronisées`);
    }
  } catch (error) {
    console.warn('⚠️ Impossible de charger les destinations (mode offline)');
    // L'application continue de fonctionner avec les données locales existantes
  }
};
```

### 2. Utiliser les agences dans le formulaire de création de départ

```typescript
import { offlineAgenceApi, OfflineAgence } from '../services/offline-api';

export const DepartureFormModal = () => {
  const [agences, setAgences] = useState<OfflineAgence[]>([]);
  const [selectedAgence, setSelectedAgence] = useState<number | null>(null);

  useEffect(() => {
    loadAgences();
  }, []);

  const loadAgences = async () => {
    try {
      // Charger depuis la BD locale - instantané !
      const data = await offlineAgenceApi.getAll();
      setAgences(data);
    } catch (error) {
      console.error('Erreur chargement agences:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Agence de destination</label>
        <select
          value={selectedAgence || ''}
          onChange={(e) => setSelectedAgence(Number(e.target.value))}
          required
        >
          <option value="">Sélectionner une agence</option>
          {agences.map((agence) => (
            <option key={agence.id} value={agence.remote_id}>
              {agence.ag_nom} - {agence.ag_ville}
            </option>
          ))}
        </select>
      </div>

      {/* Autres champs du formulaire */}
    </form>
  );
};
```

### 3. Utiliser les destinations dans le formulaire de vente de billets

```typescript
import { offlineDestinationApi, OfflineDestination } from '../services/offline-api';

export const TicketSaleModal = ({ departure }: { departure: OfflineDeparture }) => {
  const [destinations, setDestinations] = useState<OfflineDestination[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<number | null>(null);

  useEffect(() => {
    loadDestinations();
  }, []);

  const loadDestinations = async () => {
    try {
      // Charger toutes les destinations depuis la BD locale
      const data = await offlineDestinationApi.getAll();
      setDestinations(data);
    } catch (error) {
      console.error('Erreur chargement destinations:', error);
    }
  };

  const handleDestinationChange = (destId: number) => {
    setSelectedDestination(destId);

    // Récupérer le prix de la destination sélectionnée
    const dest = destinations.find(d => d.remote_id === destId);
    if (dest) {
      setPrice(parseFloat(dest.dest_price));
    }
  };

  return (
    <form onSubmit={handleSellTicket}>
      <div>
        <label>Destination</label>
        <select
          value={selectedDestination || ''}
          onChange={(e) => handleDestinationChange(Number(e.target.value))}
          required
        >
          <option value="">Sélectionner une destination</option>
          {destinations.map((dest) => (
            <option key={dest.id} value={dest.remote_id}>
              {dest.dest_ville} - {dest.dest_price} FCFA
            </option>
          ))}
        </select>
      </div>

      {/* Autres champs du formulaire */}
    </form>
  );
};
```

### 4. Filtrer les destinations par agence (optionnel)

Si vous voulez afficher uniquement les destinations pour une agence spécifique :

```typescript
const loadDestinationsByAgence = async (agenceId: number) => {
  try {
    const data = await offlineDestinationApi.getByAgence(agenceId);
    setDestinations(data);
  } catch (error) {
    console.error('Erreur chargement destinations par agence:', error);
  }
};
```

## Exemple complet - AuthContext avec sync

```typescript
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authApi } from '../services/api';
import { gareApi, destinationApi } from '../services/api';
import { offlineAgenceApi, offlineDestinationApi } from '../services/offline-api';

interface User {
  usid: number;
  agid: number;
  nom: string;
  agnom: string;
}

interface AuthContextType {
  user: User | null;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Charger l'utilisateur depuis localStorage au démarrage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (phone: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(phone, password);

      if (response.status === 200) {
        const userData = {
          usid: response.usid,
          agid: response.agid,
          nom: response.nom,
          agnom: response.agnom,
        };

        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));

        // Synchroniser les données de référence
        await syncReferenceData(response.usid, response.agid);
      } else {
        throw new Error(response.msg || 'Erreur de connexion');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const syncReferenceData = async (userId: number, agenceId: number) => {
    // Charger les agences en arrière-plan (ne bloque pas la connexion)
    gareApi.loadGareDest(userId)
      .then((response) => {
        if (response.status === 200 && response.data) {
          return offlineAgenceApi.syncFromOnline(response.data);
        }
      })
      .then((count) => {
        console.log(`✅ ${count} agences synchronisées`);
      })
      .catch((error) => {
        console.warn('⚠️ Impossible de synchroniser les agences:', error);
      });

    // Charger les destinations en arrière-plan
    destinationApi.loadDest(agenceId)
      .then((response) => {
        if (response.status === 200 && response.data) {
          return offlineDestinationApi.syncFromOnline(response.data);
        }
      })
      .then((count) => {
        console.log(`✅ ${count} destinations synchronisées`);
      })
      .catch((error) => {
        console.warn('⚠️ Impossible de synchroniser les destinations:', error);
      });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

## Avantages

✅ **Pas de doublons** : `INSERT OR REPLACE` garantit l'unicité basée sur `remote_id`

✅ **Charge une seule fois** : Les données sont chargées après connexion et restent en cache local

✅ **Fonctionne offline** : Si la sync échoue, l'app utilise les données locales existantes

✅ **Performance** : Les selects sont instantanés (lecture locale au lieu d'appels API)

✅ **Mise à jour automatique** : À chaque connexion, les données sont rafraîchies si disponibles

## Vérification

Pour vérifier que les données sont bien chargées, ouvrez la console :

```typescript
import { offlineAgenceApi, offlineDestinationApi } from './services/offline-api';

// Vérifier les agences
offlineAgenceApi.getAll().then(agences => {
  console.log('Agences en BD locale:', agences);
});

// Vérifier les destinations
offlineDestinationApi.getAll().then(destinations => {
  console.log('Destinations en BD locale:', destinations);
});
```

## Notes importantes

1. **Première connexion** : Les données sont vides, elles seront chargées après le premier login
2. **Reconnexion** : Les données sont mises à jour mais pas dupliquées
3. **Mode offline** : Si pas de connexion, utilise les données locales existantes
4. **Performance** : Aucun délai - les selects utilisent les données locales
