# Exemple de Migration vers le Mode Offline

Ce document montre comment migrer une page existante pour utiliser le mode offline.

## Exemple 1 : Page de création de départ

### Avant (avec API en ligne)

```tsx
import { departureApi, CreateDepartureRequest } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export const DeparturePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleCreateDeparture = async (formData: any) => {
    setLoading(true);
    try {
      const request: CreateDepartureRequest = {
        user: user.usid,
        dep: formData.departure,
        dest: formData.destination,
        place: formData.seats,
        car: formData.carNumber,
        chauff: formData.driver,
        conv: formData.convoy,
        datedep: formData.date,
        hdep: formData.time,
      };

      const response = await departureApi.createDeparture(request);

      if (response.status === 200) {
        toast.success('Départ créé avec succès');
        // Recharger la liste
      } else {
        toast.error(response.msg);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    // ... UI
  );
};
```

### Après (avec mode offline)

```tsx
import { offlineDepartureApi } from '../services/offline-api';
import { useAuth } from '../contexts/AuthContext';
import { SyncStatus } from '../components/SyncStatus';

export const DeparturePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleCreateDeparture = async (formData: any) => {
    setLoading(true);
    try {
      const request = {
        user: user.usid,
        dep: formData.departure,
        dest: formData.destination,
        place: formData.seats,
        car: formData.carNumber,
        chauff: formData.driver,
        conv: formData.convoy,
        datedep: formData.date,
        hdep: formData.time,
      };

      // Créé immédiatement en local, sera synchronisé en arrière-plan
      const departure = await offlineDepartureApi.create(request, user.agid);

      toast.success('Départ créé avec succès (sera synchronisé automatiquement)');
      // Recharger la liste depuis la BD locale
      loadDepartures();
    } catch (error: any) {
      toast.error(error || 'Erreur de création');
    } finally {
      setLoading(false);
    }
  };

  const loadDepartures = async () => {
    try {
      // Charge depuis la BD locale - instantané !
      const departures = await offlineDepartureApi.getAll(user.usid);
      setDepartures(departures);
    } catch (error) {
      console.error('Erreur chargement départs:', error);
    }
  };

  useEffect(() => {
    loadDepartures();
  }, []);

  return (
    <div>
      {/* ... UI */}

      {/* Widget de statut de synchronisation */}
      <SyncStatus />
    </div>
  );
};
```

## Exemple 2 : Page de vente de tickets

### Avant

```tsx
import { ticketApi, SellBilletRequest } from '../services/api';

const handleSellTicket = async (data: any) => {
  try {
    const request: SellBilletRequest = {
      user: user.usid,
      depart: selectedDeparture.dep_id,
      dest: data.destination,
      siege: data.seatNumber,
      phone: data.phone,
      voyageur: data.passengerName,
      price: data.price,
      method: data.paymentMethod,
      reduction: data.reduction || 0,
      nature: data.nature,
    };

    const response = await ticketApi.sellBillet(request);

    if (response.status === 200) {
      // Imprimer le ticket
      printTicket(response.data[0]);
    }
  } catch (error: any) {
    toast.error('Erreur de vente');
  }
};
```

### Après

```tsx
import { offlineTicketApi } from '../services/offline-api';

const handleSellTicket = async (data: any) => {
  try {
    const request = {
      user: user.usid,
      depart: selectedDeparture.id!, // ID local du départ
      dest: data.destination,
      siege: data.seatNumber,
      phone: data.phone,
      voyageur: data.passengerName,
      price: data.price,
      method: data.paymentMethod,
      reduction: data.reduction || 0,
      nature: data.nature,
    };

    // Vente immédiate en local
    const ticket = await offlineTicketApi.sell(request);

    // Imprimer le ticket immédiatement
    // (même si pas encore synchronisé avec le serveur)
    printTicket(ticket);

    toast.success('Ticket vendu (synchronisation en cours...)');
  } catch (error: any) {
    toast.error('Erreur de vente');
  }
};
```

## Exemple 3 : Affichage de la liste des départs avec indicateur de sync

```tsx
import { offlineDepartureApi, OfflineDeparture } from '../services/offline-api';

export const DeparturesList = () => {
  const [departures, setDepartures] = useState<OfflineDeparture[]>([]);

  const loadDepartures = async () => {
    const data = await offlineDepartureApi.getAll(user.usid);
    setDepartures(data);
  };

  useEffect(() => {
    loadDepartures();

    // Recharger toutes les 5 secondes pour voir les mises à jour de sync
    const interval = setInterval(loadDepartures, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {departures.map(dep => (
        <div key={dep.id} className="departure-card">
          <h3>{dep.dep_nom}</h3>
          <p>Destination: {dep.dep_dest}</p>

          {/* Indicateur de statut de synchronisation */}
          <div className="flex items-center gap-2">
            {dep.sync_status === 'pending' && (
              <span className="text-yellow-500 text-xs">
                ⏳ En attente de synchronisation
              </span>
            )}
            {dep.sync_status === 'synced' && (
              <span className="text-green-500 text-xs">
                ✅ Synchronisé
              </span>
            )}
            {dep.sync_status === 'error' && (
              <span className="text-red-500 text-xs" title={dep.sync_error}>
                ❌ Erreur de synchronisation
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
```

## Exemple 4 : Stratégie hybride (online/offline)

Pour certaines opérations, vous pourriez vouloir une stratégie hybride :

```tsx
import { offlineDepartureApi } from '../services/offline-api';
import { departureApi } from '../services/api';

const handleCreateDeparture = async (formData: any) => {
  try {
    // Essayer d'abord en online (pour avoir l'ID immédiatement)
    const onlineResponse = await departureApi.createDeparture(formData);

    if (onlineResponse.status === 200) {
      toast.success('Départ créé et synchronisé');
      return;
    }
  } catch (error) {
    console.warn('Mode online indisponible, passage en mode offline');
  }

  // Si échec online, créer en offline
  try {
    await offlineDepartureApi.create(formData, user.agid);
    toast.success('Départ créé en mode offline (sera synchronisé plus tard)');
  } catch (error) {
    toast.error('Erreur de création du départ');
  }
};
```

## Bonnes pratiques

1. **Toujours afficher le statut de sync** pour que l'utilisateur sache si ses données sont synchronisées

2. **Gérer les erreurs de sync** en affichant des messages clairs à l'utilisateur

3. **Recharger périodiquement** les données locales pour voir les mises à jour de synchronisation

4. **Utiliser le widget SyncStatus** pour donner une visibilité globale sur l'état de la synchronisation

5. **Tester en mode offline** pour s'assurer que tout fonctionne sans connexion

6. **Prévoir un bouton de sync manuel** pour que l'utilisateur puisse forcer la synchronisation si besoin

## Migration progressive

Vous n'avez pas besoin de tout migrer d'un coup. Vous pouvez :

1. **Commencer par les départs et tickets** (déjà implémentés)
2. **Garder les autres opérations en mode online** temporairement
3. **Migrer progressivement** les autres fonctionnalités

Exemple de coexistence :

```tsx
// Départs et tickets en offline
import { offlineDepartureApi } from '../services/offline-api';
import { offlineTicketApi } from '../services/offline-api';

// Autres opérations encore en online
import { colisApi, bagageApi } from '../services/api';
```

## Tests

Pour tester le mode offline :

1. **Désactiver le réseau** dans les dev tools du navigateur
2. **Créer des départs et tickets**
3. **Vérifier qu'ils apparaissent avec le statut "pending"**
4. **Réactiver le réseau**
5. **Vérifier que les données se synchronisent** (statut passe à "synced")

## Debugging

Pour voir les logs de synchronisation :

1. **Ouvrir la console de développement** de l'application Tauri
2. **Les logs de sync apparaissent avec** ✅ (succès) ou ❌ (erreur)
3. **Consulter la base de données** directement si besoin (voir OFFLINE_MODE.md)
