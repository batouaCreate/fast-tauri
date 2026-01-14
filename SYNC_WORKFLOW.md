# Workflow de Synchronisation Offline → Online

## Vue d'ensemble

Le système de synchronisation fonctionne en arrière-plan et synchronise les données locales vers l'API distante. **Il est crucial que les départs soient synchronisés AVANT les tickets** car les tickets nécessitent l'ID distant du départ.

## Ordre de synchronisation

### 1. Synchronisation des Départs (PRIORITÉ)
- **API**: `/adddepart`
- **Fréquence**: Toutes les 30 secondes (configurable)
- **Processus**:
  1. Récupère tous les départs avec `sync_status = 'pending'`
  2. Envoie chaque départ à l'API `/adddepart`
  3. Récupère le `remote_id` (ID distant) retourné par l'API
  4. Met à jour le départ local avec `remote_id` et `sync_status = 'synced'`
  5. Si erreur: marque `sync_status = 'error'` et enregistre l'erreur

**Important**: Le `remote_id` est stocké dans la table `departures` et sera utilisé pour synchroniser les tickets.

### 2. Synchronisation des Tickets (DÉPEND DES DÉPARTS)
- **API**: `/sellbillet`
- **Fréquence**: Toutes les 30 secondes, APRÈS les départs
- **Processus**:
  1. Récupère tous les tickets avec `sync_status = 'pending'`
  2. Pour chaque ticket:
     - Vérifie que le départ associé (`tick_depart`) a un `remote_id`
     - Si OUI: utilise le `remote_id` du départ dans l'appel API
     - Si NON: marque le ticket en attente avec message "En attente de la synchronisation du départ"
  3. Envoie le ticket à l'API `/sellbillet` avec le `remote_id` du départ
  4. Met à jour le ticket avec `remote_id` retourné et `sync_status = 'synced'`

**Important**: Les tickets NE PEUVENT PAS être synchronisés tant que leur départ n'a pas été synchronisé.

### 3. Synchronisation des Colis (Optionnel)
- **API**: `/createcolis_v2`
- Même logique que les tickets

### 4. Synchronisation des Bagages (Optionnel)
- **API**: `/createbagage`
- Même logique que les tickets

## Flux de données

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Utilisateur crée un départ en local                     │
│    └─> BD SQLite: departures (sync_status='pending')       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Worker de sync (30s)                                     │
│    └─> Envoie à /adddepart                                 │
│    └─> Reçoit remote_id du départ                          │
│    └─> Met à jour departures.remote_id                     │
│    └─> Met sync_status='synced'                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Utilisateur vend un ticket                              │
│    └─> BD SQLite: tickets (sync_status='pending')          │
│    └─> tick_depart = ID LOCAL du départ                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Worker de sync (30s)                                     │
│    └─> Récupère remote_id du départ via tick_depart        │
│    └─> Si remote_id existe:                                │
│        └─> Envoie à /sellbillet avec remote_id             │
│        └─> Met à jour tickets.remote_id                    │
│        └─> Met sync_status='synced'                        │
│    └─> Si remote_id n'existe pas:                          │
│        └─> Attend que le départ soit synchronisé           │
│        └─> sync_error = "En attente..."                    │
└─────────────────────────────────────────────────────────────┘
```

## Structure de la requête API

### Création de départ (`/adddepart`)
```json
{
  "user": 123,
  "dep": "DEPART 1",
  "dest": 456,          // ID de l'agence de destination
  "place": 45,
  "car": "BUS-001",
  "chauff": "Jean",
  "conv": "Paul",
  "datedep": "2024-01-15",
  "hdep": "08:00"
}
```

**Réponse attendue:**
```json
{
  "status": 200,
  "msg": "Départ créé avec succès",
  "data": {
    "dep_id": 789      // ID DISTANT du départ créé
  }
}
```

### Vente de ticket (`/sellbillet`)
```json
{
  "user": 123,
  "depart": 789,        // REMOTE_ID du départ (pas l'ID local!)
  "dest": 5,            // ID de la destination
  "siege": 12,
  "phone": "+2250123456789",
  "voyageur": "Kouassi Jean",
  "price": 5000,
  "method": "ESPECES",
  "reduction": 0,
  "nature": "PAYANT"
}
```

**Réponse attendue:**
```json
{
  "status": 200,
  "msg": "Ticket vendu avec succès",
  "data": [{
    "tick_id": 1001    // ID DISTANT du ticket créé
  }]
}
```

## Gestion des erreurs

### Erreurs de départ
- Stockées dans `departures.sync_error`
- `sync_status = 'error'`
- Le worker réessaie à chaque cycle (30s)

### Erreurs de ticket
- **Départ non synchronisé**: Message "En attente de la synchronisation du départ"
- **Erreur API**: Stockée dans `tickets.sync_error`, `sync_status = 'error'`
- Le worker réessaie à chaque cycle

## Logs de synchronisation

### Départ synchronisé
```
📝 [SYNC] Départ synchronisé avec remote_id: 789
✅ Départ 1 synchronisé avec succès
```

### Ticket synchronisé
```
🎫 [SYNC] Synchronisation ticket local_id=5 avec departure_remote_id=789
✅ Ticket 5 synchronisé avec succès (remote_id: 1001)
```

### Ticket en attente
```
⏳ Ticket 5 en attente: le départ 2 doit être synchronisé d'abord
```

## Configuration

### Intervalle de synchronisation
Défini dans `src-tauri/src/lib.rs`:
```rust
db::sync::start_sync_worker(db_path, api_base_url, 30).await;
//                                                      ^^
//                                              30 secondes
```

### URL de l'API
Définie dans `src-tauri/src/lib.rs`:
```rust
let api_base_url = "https://guichet.createsarl.com/api".to_string();
```

## Points importants

1. ✅ Les départs DOIVENT être synchronisés avant les tickets
2. ✅ Les tickets utilisent le `remote_id` du départ, pas l'ID local
3. ✅ Le worker vérifie automatiquement si le départ est synchronisé
4. ✅ Les tickets en attente seront automatiquement synchronisés une fois le départ synchronisé
5. ✅ Tout fonctionne en arrière-plan sans intervention de l'utilisateur
6. ✅ Les erreurs sont enregistrées et le worker réessaie automatiquement

## Diagnostic

Pour vérifier l'état de la synchronisation depuis la console du navigateur:
```javascript
await dbDiagnostic()
```

Cela affichera:
- Nombre de départs en attente/synchronisés/en erreur
- Nombre de tickets en attente/synchronisés/en erreur
- Détails des erreurs éventuelles
