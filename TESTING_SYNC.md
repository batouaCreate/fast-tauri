# Testing the Reference Data Synchronization

The synchronization system is now fully implemented and ready to test!

## What Was Changed

### 1. AuthContext.tsx
- Added automatic synchronization after successful login
- Syncs agencies (gares de destination) and destinations to local SQLite database
- Comprehensive logging at each step

### 2. main.tsx
- Imported test utilities to make them available in browser console

## How to Test

### Step 1: Start the Application

```bash
npm run tauri dev
```

**Expected startup logs in TERMINAL:**
```
🚀 [STARTUP] Démarrage de l'application Fast-App
💾 [STARTUP] Initialisation de la base de données SQLite...
📁 [STARTUP] Base de données créée à: "/Users/batouajeanfernand/Library/Application Support/com.macbookair.fast-app/fast_app.db"
🔧 [STARTUP] Création des tables...
✅ [STARTUP] Tables créées avec succès
✅ [STARTUP] Base de données prête
```

**Expected console logs in BROWSER (F12 → Console):**
```
🧪 Fonctions de test disponibles dans la console:
   - dbDiagnostic()                    // Diagnostic complet BD
   - testSyncAgences(userId)           // Test sync agences
   - testSyncDestinations(agenceId)    // Test sync destinations
   - testCompletSync(userId, agenceId) // Test complet
   - checkLocalData()                  // Vérifier contenu BD
```

### Step 2: Log In Through the UI

Use your credentials to log in.

**Expected logs in BROWSER console:**
```
🔐 [AUTH] Tentative de connexion...
✅ [AUTH] Connexion réussie, userId: 123, agenceId: 456
📡 [AUTH] Synchronisation des données de référence...
📡 [AUTH] Chargement des agences...
📦 [AUTH] 5 agences reçues de l'API
🔌 Synchronisation agences vers la BD locale: 5
✅ Agences synchronisées: 5
✅ [AUTH] 5 agences synchronisées en local
📡 [AUTH] Chargement des destinations...
📦 [AUTH] 10 destinations reçues de l'API
🔌 Synchronisation destinations vers la BD locale: 10
✅ Destinations synchronisées: 10
✅ [AUTH] 10 destinations synchronisées en local
✅ [AUTH] Synchronisation des données de référence terminée
```

**Expected logs in TERMINAL (Rust side):**
```
🔄 [RUST] sync_agences appelé
📊 [RUST] JSON reçu (taille): XXXX bytes
📦 [RUST] Nombre d'agences à synchroniser: 5
✅ [RUST] 5 agences synchronisées avec succès

🔄 [RUST] sync_destinations appelé
📊 [RUST] JSON reçu (taille): XXXX bytes
📦 [RUST] Nombre de destinations à synchroniser: 10
✅ [RUST] 10 destinations synchronisées avec succès
```

### Step 3: Verify Database Contents

In the browser console (F12), run:

```javascript
await dbDiagnostic()
```

**Expected output:**
```
🔍 [DIAGNOSTIC] ==========================================
🔍 [DIAGNOSTIC] DIAGNOSTIC COMPLET DE LA BASE DE DONNÉES
🔍 [DIAGNOSTIC] ==========================================
📊 [DIAGNOSTIC] Résultat:
📊 Statistiques BD:
 - Agences: 5
 - Destinations: 10
 - Départs: 0
 - Tickets: 0
 - Colis: 0
 - Bagages: 0
🔍 [DIAGNOSTIC] Vérification croisée:
   - Agences (via API): 5
   - Destinations (via API): 10
```

### Step 4: Check Local Data (Optional)

To see actual data records:

```javascript
await checkLocalData()
```

This will display sample records from the database.

## Troubleshooting

### ❌ No startup logs in terminal
**Solution:**
1. Make sure you're looking at the correct terminal window
2. Try stopping the app (Ctrl+C) and restarting with `npm run tauri dev`

### ❌ No test functions available in console
**Solution:**
1. Check that the browser console shows the "Fonctions de test disponibles" message
2. If not, verify that `src/main.tsx` imports `'./utils/test-sync'`
3. Restart the application

### ❌ No synchronization logs after login
**Solution:**
1. Check browser console for errors
2. Verify you're connected to the internet (needs API access)
3. Check that your userId and agenceId are valid
4. Look for error messages starting with `❌ [AUTH]`

### ❌ API returns no data
**Possible causes:**
- Invalid userId or agenceId
- API endpoint is down or unreachable
- User doesn't have access to agencies/destinations

**Check with:**
```javascript
// Test agency API directly
const response = await gareApi.loadGareDest(YOUR_USER_ID);
console.log(response);

// Test destination API directly
const response2 = await destinationApi.loadDest(YOUR_AGENCE_ID);
console.log(response2);
```

### ❌ Data syncs but doesn't persist after restart
**Solution:**
- Check that the SQLite database file exists at the path shown in startup logs
- Verify file permissions
- Check for errors in sync operations

## Manual Testing Commands

### Test agency sync manually:
```javascript
await testSyncAgences(YOUR_USER_ID)
```

### Test destination sync manually:
```javascript
await testSyncDestinations(YOUR_AGENCE_ID)
```

### Full sync test:
```javascript
await testCompletSync(YOUR_USER_ID, YOUR_AGENCE_ID)
```

## Next Steps After Testing

Once synchronization is confirmed working:

1. **Update UI components** to use local data:
   - In departure creation form: `const agences = await offlineAgenceApi.getAll()`
   - In ticket sale form: `const destinations = await offlineDestinationApi.getAll()`

2. **Test offline mode**:
   - Log in while online (data syncs)
   - Disconnect from internet
   - Try creating a departure or selling a ticket
   - Should work using local data

3. **Test background sync**:
   - The background worker runs every 30 seconds
   - Any pending departures/tickets will sync automatically
   - Check terminal for sync worker logs

## Database Location

Your SQLite database is located at:
```
/Users/batouajeanfernand/Library/Application Support/com.macbookair.fast-app/fast_app.db
```

You can inspect it using any SQLite viewer tool if needed.

## Success Criteria

✅ Startup logs appear in terminal
✅ Test functions available in browser console
✅ Login triggers synchronization
✅ Agences sync successfully (logs confirm count)
✅ Destinations sync successfully (logs confirm count)
✅ `dbDiagnostic()` shows correct counts
✅ `checkLocalData()` shows actual records
✅ Data persists after app restart

If all these criteria are met, the synchronization system is working correctly!
