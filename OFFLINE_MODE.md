# Mode Offline - Documentation

## Vue d'ensemble

Le système offline-first permet à l'application de fonctionner sans connexion internet. Les données sont stockées localement dans une base SQLite et synchronisées automatiquement en arrière-plan lorsque la connexion est disponible.

## Architecture

### Composants principaux

1. **Base de données SQLite locale** (`src-tauri/src/db/`)
   - Stockage local de toutes les données
   - Tables: departures, tickets, colis, bagages, destinations
   - Métadonnées de synchronisation (sync_status, last_sync_attempt, etc.)

2. **Système de synchronisation** (`src-tauri/src/db/sync.rs`)
   - Worker en arrière-plan qui s'exécute toutes les 30 secondes
   - Synchronise les données locales avec l'API distante
   - Gestion des erreurs et des tentatives de retry

3. **Commandes Tauri** (`src-tauri/src/commands.rs`)
   - Interface entre le frontend et la base de données
   - Expose les opérations CRUD via Tauri

4. **API TypeScript** (`src/services/offline-api.ts`)
   - Encapsule les appels aux commandes Tauri
   - Interface simple pour le frontend

## Utilisation

### Créer un départ (offline)

```typescript
import { offlineDepartureApi } from './services/offline-api';

const departure = await offlineDepartureApi.create({
  user: userId,
  dep: "Yaoundé",
  dest: destinationId,
  place: 70,
  car: "ABC-123",
  chauff: "John Doe",
  conv: "Jane Smith",
  datedep: "2024-01-15",
  hdep: "08:00"
}, agenceId);

// Le départ est immédiatement créé dans la BD locale
// Il sera synchronisé automatiquement en arrière-plan
```

### Vendre un ticket (offline)

```typescript
import { offlineTicketApi } from './services/offline-api';

const ticket = await offlineTicketApi.sell({
  user: userId,
  depart: departureId,
  dest: destinationId,
  siege: 15,
  phone: "+237690000000",
  voyageur: "Alice Martin",
  price: 5000,
  method: "CASH",
  reduction: 0,
  nature: "PAYANT"
});

// Le ticket est créé localement et sera synchronisé
```

### Récupérer les départs

```typescript
import { offlineDepartureApi } from './services/offline-api';

// Récupérer tous les départs de l'utilisateur
const departures = await offlineDepartureApi.getAll(userId);

// Récupérer un départ spécifique
const departure = await offlineDepartureApi.getById(departureId);
```

### Vérifier le statut de synchronisation

```typescript
import { syncApi } from './services/offline-api';

const status = await syncApi.getStatus();
console.log('Départs en attente:', status.pending_departures);
console.log('Tickets en attente:', status.pending_tickets);
console.log('Erreurs départs:', status.error_departures);
console.log('Erreurs tickets:', status.error_tickets);
```

### Forcer la synchronisation

```typescript
import { syncApi } from './services/offline-api';

await syncApi.forceSync();
```

### Afficher le widget de synchronisation

```tsx
import { SyncStatus } from './components/SyncStatus';

function App() {
  return (
    <div>
      {/* Votre application */}
      <SyncStatus />
    </div>
  );
}
```

## Statuts de synchronisation

Chaque enregistrement a un statut de synchronisation:

- **`pending`**: En attente de synchronisation
- **`synced`**: Synchronisé avec succès
- **`error`**: Erreur lors de la synchronisation (consulter `sync_error`)

## Migration des APIs existantes

Pour migrer une API existante vers le mode offline:

### Avant (API distante)

```typescript
import { departureApi } from './services/api';

const response = await departureApi.createDeparture({
  user: userId,
  // ... autres paramètres
});
```

### Après (API offline)

```typescript
import { offlineDepartureApi } from './services/offline-api';

const departure = await offlineDepartureApi.create({
  user: userId,
  // ... autres paramètres
}, agenceId);
```

## Configuration

### Changer l'intervalle de synchronisation

Dans `src-tauri/src/lib.rs`, ligne 45:

```rust
// Synchronisation toutes les 30 secondes (valeur par défaut)
db::sync::start_sync_worker(db_path, api_base_url, 30).await;

// Pour changer à 60 secondes:
db::sync::start_sync_worker(db_path, api_base_url, 60).await;
```

### Changer l'URL de l'API

Dans `src-tauri/src/lib.rs`, ligne 42:

```rust
let api_base_url = "https://fastransport.org/api".to_string();
```

## Base de données

La base de données SQLite est stockée dans:

- **macOS**: `~/Library/Application Support/com.fast-app.app/fast_app.db`
- **Windows**: `C:\Users\<USER>\AppData\Roaming\com.fast-app.app\fast_app.db`
- **Linux**: `~/.local/share/com.fast-app.app/fast_app.db`

## Gestion des conflits

Actuellement, le système utilise une stratégie "last-write-wins":
- Les données locales non synchronisées sont envoyées au serveur
- Le serveur retourne l'ID distant qui est stocké dans `remote_id`
- Pas de résolution de conflits complexes

Pour une gestion plus avancée des conflits, vous pouvez:
1. Ajouter un champ `version` ou `last_modified_timestamp`
2. Comparer les versions lors de la synchronisation
3. Implémenter une logique de résolution (prendre le plus récent, merger, demander à l'utilisateur, etc.)

## Troubleshooting

### La synchronisation ne fonctionne pas

1. Vérifier les logs dans la console Rust
2. Vérifier le statut de synchronisation avec `syncApi.getStatus()`
3. Consulter le champ `sync_error` dans la base de données

### Réinitialiser la base de données

Supprimer le fichier `fast_app.db` (voir chemins ci-dessus) et relancer l'application.

### Voir les requêtes SQL

Les erreurs SQL sont loguées dans la console. Pour plus de détails, ajouter des logs dans `src-tauri/src/db/operations.rs`.

## Prochaines étapes

1. **Ajouter le support pour les colis et bagages** (déjà préparé, à tester)
2. **Implémenter la synchronisation des destinations**
3. **Ajouter un système de queue plus robuste** avec retry exponentiel
4. **Implémenter la synchronisation incrémentale** (ne récupérer que les nouvelles données)
5. **Ajouter des tests unitaires** pour les opérations de base de données
6. **Implémenter la compression** pour les grandes images
7. **Ajouter un système de cache** pour les données fréquemment consultées

## Avantages du système offline

✅ **Fonctionnement sans internet**: L'application reste utilisable même hors ligne
✅ **Performance**: Les opérations sont instantanées (pas d'attente réseau)
✅ **Fiabilité**: Pas de perte de données en cas de coupure réseau
✅ **Synchronisation transparente**: L'utilisateur n'a pas besoin de gérer manuellement la sync
✅ **Résilience**: Les erreurs de synchronisation sont gérées automatiquement
