# Guide de Débogage - Synchronisation Agences & Destinations

## 1. Voir les logs

### Logs Rust (Backend)

Les logs Rust s'affichent dans le **terminal** où vous avez lancé `npm run tauri dev`.

Cherchez les lignes avec ces préfixes :
- `🔄 [RUST] sync_agences appelé` - La commande de sync a été appelée
- `📦 [RUST] Nombre d'agences à synchroniser: X` - Nombre d'agences reçues
- `✅ [RUST] X agences synchronisées avec succès` - Succès
- `❌ [RUST] Erreur...` - Erreurs

### Logs TypeScript (Frontend)

Les logs TypeScript s'affichent dans la **console du navigateur** (F12 → Console).

Cherchez les lignes avec ces préfixes :
- `🔌 Synchronisation agences vers la BD locale: X`
- `✅ Agences synchronisées: X`
- `❌ Erreur sync agences:`

## 2. Tester manuellement

### Depuis la console du navigateur

J'ai créé des fonctions de test. Dans la console du navigateur (F12), tapez :

```javascript
// Vérifier les données actuelles
await checkLocalData()

// Tester la sync des agences (remplacez 123 par votre userId)
await testSyncAgences(123)

// Tester la sync des destinations (remplacez 456 par votre agenceId)
await testSyncDestinations(456)

// Test complet
await testCompletSync(123, 456)
```

### Importer les fonctions de test

Dans votre code, importez :

```typescript
import '../utils/test-sync';
```

Ajoutez cette ligne dans votre `App.tsx` ou `main.tsx` pour avoir accès aux fonctions de test.

## 3. Vérifier le flux complet

### Étape 1 : Vérifier que l'API retourne des données

Dans votre code après connexion :

```typescript
// Test : Charger les agences depuis l'API
const response = await gareApi.loadGareDest(userId);
console.log('📊 Réponse API agences:', response);

// Vérifiez que vous avez :
// - response.status === 200
// - response.data existe et n'est pas vide
// - response.data est un tableau
```

### Étape 2 : Vérifier l'appel de synchronisation

```typescript
// Test : Synchroniser en local
try {
  const count = await offlineAgenceApi.syncFromOnline(response.data);
  console.log('✅ Agences synchronisées:', count);
} catch (error) {
  console.error('❌ Erreur sync:', error);
}
```

**Regardez le terminal Rust** pour voir :
- `🔄 [RUST] sync_agences appelé`
- `📦 [RUST] Nombre d'agences à synchroniser: X`
- `✅ [RUST] X agences synchronisées avec succès`

### Étape 3 : Vérifier la lecture

```typescript
// Test : Lire depuis la BD locale
const agences = await offlineAgenceApi.getAll();
console.log('📦 Agences en BD:', agences);
```

**Regardez le terminal Rust** pour voir :
- `📖 [RUST] get_all_agences_offline appelé`
- `📦 [RUST] X agences récupérées de la BD`

## 4. Problèmes courants et solutions

### Problème : Aucun log Rust

**Cause** : Les fonctions ne sont pas appelées

**Solution** :
1. Vérifiez que vous appelez bien les fonctions après la connexion
2. Vérifiez que l'import est correct : `import { offlineAgenceApi } from './services/offline-api'`
3. Vérifiez que vous attendez avec `await`

### Problème : "Command not found" ou erreur Tauri

**Cause** : Les commandes ne sont pas enregistrées

**Solution** :
1. Recompilez : `cargo check`
2. Redémarrez l'app : Ctrl+C puis `npm run tauri dev`
3. Vérifiez que les commandes sont dans `lib.rs` :
   - `commands::sync_agences`
   - `commands::get_all_agences_offline`

### Problème : JSON parse error

**Cause** : Le format des données n'est pas correct

**Solution** :
```typescript
// Vérifiez le format des données avant de synchroniser
console.log('Données API:', JSON.stringify(response.data, null, 2));

// Les données doivent être un tableau d'objets avec ces champs :
// { ag_id, ag_nom, ag_code, ag_phone, ag_pays, ag_ville, etc. }
```

### Problème : 0 agences synchronisées mais pas d'erreur

**Cause** : Les données sont vides

**Solution** :
```typescript
// Vérifiez que l'API retourne des données
const response = await gareApi.loadGareDest(userId);
console.log('Nombre d\'agences de l\'API:', response.data?.length);

// Si 0, le problème vient de l'API, pas de la synchronisation
```

### Problème : Agences dupliquées

**Cause** : Impossible - le système utilise `INSERT OR REPLACE` sur `remote_id`

**Vérification** :
```typescript
const agences = await offlineAgenceApi.getAll();
const ids = agences.map(a => a.remote_id);
const uniqueIds = [...new Set(ids)];
console.log('Agences totales:', agences.length);
console.log('IDs uniques:', uniqueIds.length);
// Si différent, contactez-moi
```

## 5. Exemple de code complet pour tester

Créez un fichier `test-sync.tsx` :

```typescript
import React, { useEffect, useState } from 'react';
import { gareApi, destinationApi } from './services/api';
import { offlineAgenceApi, offlineDestinationApi } from './services/offline-api';

export const TestSyncPage = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [userId] = useState(123); // Remplacez par votre userId
  const [agenceId] = useState(456); // Remplacez par votre agenceId

  const log = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, message]);
  };

  const testAgences = async () => {
    log('🧪 TEST AGENCES - Début');

    try {
      // 1. Charger depuis API
      log('📡 Appel API loadGareDest...');
      const response = await gareApi.loadGareDest(userId);
      log(`📊 API retourné: status=${response.status}, data=${response.data?.length || 0} agences`);

      if (response.status === 200 && response.data) {
        // 2. Synchroniser
        log('💾 Synchronisation en local...');
        const count = await offlineAgenceApi.syncFromOnline(response.data);
        log(`✅ ${count} agences synchronisées`);

        // 3. Lire
        log('📖 Lecture depuis BD locale...');
        const agences = await offlineAgenceApi.getAll();
        log(`📦 ${agences.length} agences en BD`);

        if (agences.length > 0) {
          log(`📋 Exemple: ${agences[0].ag_nom}`);
        }
      } else {
        log(`⚠️ API error: ${response.msg}`);
      }
    } catch (error: any) {
      log(`❌ Erreur: ${error.message || error}`);
    }

    log('🧪 TEST AGENCES - Fin');
  };

  const testDestinations = async () => {
    log('🧪 TEST DESTINATIONS - Début');

    try {
      log('📡 Appel API loadDest...');
      const response = await destinationApi.loadDest(agenceId);
      log(`📊 API retourné: status=${response.status}, data=${response.data?.length || 0} destinations`);

      if (response.status === 200 && response.data) {
        log('💾 Synchronisation en local...');
        const count = await offlineDestinationApi.syncFromOnline(response.data);
        log(`✅ ${count} destinations synchronisées`);

        log('📖 Lecture depuis BD locale...');
        const destinations = await offlineDestinationApi.getAll();
        log(`📦 ${destinations.length} destinations en BD`);

        if (destinations.length > 0) {
          log(`📋 Exemple: ${destinations[0].dest_ville} - ${destinations[0].dest_price}`);
        }
      } else {
        log(`⚠️ API error: ${response.msg}`);
      }
    } catch (error: any) {
      log(`❌ Erreur: ${error.message || error}`);
    }

    log('🧪 TEST DESTINATIONS - Fin');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Test Synchronisation</h1>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={testAgences} style={{ marginRight: '10px' }}>
          Test Agences
        </button>
        <button onClick={testDestinations}>
          Test Destinations
        </button>
      </div>

      <div style={{
        background: '#000',
        color: '#0f0',
        padding: '10px',
        height: '400px',
        overflow: 'auto',
        fontSize: '12px'
      }}>
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>

      <div style={{ marginTop: '20px', fontSize: '12px' }}>
        <strong>Regardez aussi :</strong>
        <ul>
          <li>Terminal (logs Rust avec 🔄, 📦, ✅, ❌)</li>
          <li>Console navigateur (F12)</li>
        </ul>
      </div>
    </div>
  );
};
```

## 6. Checklist de débogage

- [ ] Logs Rust visibles dans le terminal ?
- [ ] Logs TypeScript visibles dans la console navigateur ?
- [ ] L'API retourne des données (response.data pas vide) ?
- [ ] Le statut de l'API est 200 ?
- [ ] Les fonctions sync sont appelées avec `await` ?
- [ ] La compilation Rust réussit (`cargo check`) ?
- [ ] L'application est redémarrée après les changements ?

## 7. Commandes utiles

```bash
# Recompiler Rust
cd src-tauri
cargo check

# Voir la base de données (macOS)
sqlite3 ~/Library/Application\ Support/com.fast-app.app/fast_app.db
# Puis dans sqlite :
SELECT COUNT(*) FROM agences;
SELECT COUNT(*) FROM destinations;
SELECT * FROM agences LIMIT 5;
SELECT * FROM destinations LIMIT 5;
.exit

# Supprimer la BD pour repartir de zéro
rm ~/Library/Application\ Support/com.fast-app.app/fast_app.db
```

## 8. Contact

Si après avoir suivi ce guide vous avez toujours des problèmes, partagez-moi :

1. Les logs du terminal Rust
2. Les logs de la console navigateur
3. Le code où vous appelez les fonctions de sync
4. Le retour de `await gareApi.loadGareDest(userId)` dans la console
