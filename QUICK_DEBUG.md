# Guide Rapide de Débogage ⚡

## Étape 1 : Importer le fichier de test

Dans votre `App.tsx` ou `main.tsx`, ajoutez cette ligne :

```typescript
import './utils/test-sync';
```

## Étape 2 : Redémarrer l'application

```bash
npm run tauri dev
```

## Étape 3 : Regarder les logs au démarrage

Dans le **terminal**, vous devriez voir :

```
🚀 [STARTUP] Démarrage de l'application Fast-App
💾 [STARTUP] Initialisation de la base de données SQLite...
📁 [STARTUP] Base de données créée à: "/Users/votre-nom/Library/Application Support/com.fast-app.app/fast_app.db"
🔧 [STARTUP] Création des tables...
✅ [STARTUP] Tables créées avec succès
✅ [STARTUP] Base de données prête
```

**Si vous NE voyez PAS ces logs**, le problème est au niveau du démarrage de l'app.

## Étape 4 : Vérifier la BD

Ouvrez la **console du navigateur** (F12 → Console) et tapez :

```javascript
await dbDiagnostic()
```

Vous devriez voir :
```
🔍 [DIAGNOSTIC] DIAGNOSTIC COMPLET DE LA BASE DE DONNÉES
📊 Statistiques BD:
 - Agences: 0
 - Destinations: 0
 - Départs: 0
 - Tickets: 0
```

**Si vous voyez cette réponse**, la BD fonctionne ! Elle est juste vide.

**Si vous avez une erreur**, notez l'erreur exacte et partagez-la.

## Étape 5 : Tester le chargement (remplacez les IDs par les vôtres)

Dans la console :

```javascript
// Remplacez 123 par votre vrai userId
await testSyncAgences(123)
```

Vous devriez voir dans le **TERMINAL** :
```
🔄 [RUST] sync_agences appelé
📊 [RUST] JSON reçu (taille): XXX bytes
📦 [RUST] Nombre d'agences à synchroniser: 5
✅ [RUST] 5 agences synchronisées avec succès
```

Et dans la **CONSOLE** :
```
🧪 [TEST] Début du test de synchronisation des agences...
📡 [TEST] Appel API loadGareDest...
📊 [TEST] Réponse API: {status: 200, dataLength: 5}
💾 [TEST] Synchronisation vers la BD locale...
✅ [TEST] 5 agences synchronisées
```

## Étape 6 : Revérifier la BD

```javascript
await dbDiagnostic()
```

Maintenant vous devriez voir :
```
📊 Statistiques BD:
 - Agences: 5
 - Destinations: 0
 - Départs: 0
 - Tickets: 0
```

## Problèmes courants

### ❌ "Erreur : Command not found"

**Solution** :
1. Arrêtez l'app (Ctrl+C)
2. Recompilez : `cargo check`
3. Relancez : `npm run tauri dev`

### ❌ "testSyncAgences is not defined"

**Solution** : Vous n'avez pas importé `./utils/test-sync` dans votre App.tsx

### ❌ Pas de logs au démarrage

**Solution** :
1. Vérifiez que vous regardez le bon terminal
2. Redémarrez complètement l'application
3. Si toujours rien, partagez votre terminal complet

### ❌ "Aucune agence retournée par l'API"

**Solution** : Le problème vient de l'API backend, pas du système offline. Vérifiez :
- Que vous êtes connecté
- Que votre userId est correct
- Que l'API `loadGareDest` fonctionne

## Aide supplémentaire

Si après ces étapes vous avez toujours un problème, partagez-moi :

1. ✅ Les logs du démarrage (tout ce qui apparaît dans le terminal au lancement)
2. ✅ Le résultat de `await dbDiagnostic()` dans la console
3. ✅ Le résultat de `await testSyncAgences(votre_userId)` (avec logs terminal + console)
4. ✅ Toute erreur visible

---

**Raccourcis utiles** :

```javascript
// Dans la console du navigateur (F12)
await dbDiagnostic()                    // Voir l'état de la BD
await testSyncAgences(123)              // Test agences
await testSyncDestinations(456)         // Test destinations
await testCompletSync(123, 456)         // Test complet
await checkLocalData()                  // Voir le contenu
```
