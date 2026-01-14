/**
 * Utilitaire de test pour la synchronisation des agences et destinations
 *
 * Utilisation : Appelez ces fonctions depuis la console du navigateur
 */

import { gareApi, destinationApi } from '../services/api';
import { offlineAgenceApi, offlineDestinationApi, diagnosticApi } from '../services/offline-api';

/**
 * Test de synchronisation des agences
 * @param userId - ID de l'utilisateur connecté
 */
export async function testSyncAgences(userId: number) {
  console.log('🧪 [TEST] Début du test de synchronisation des agences...');
  console.log('👤 [TEST] User ID:', userId);

  try {
    // 1. Charger depuis l'API
    console.log('📡 [TEST] Appel API loadGareDest...');
    const response = await gareApi.loadGareDest(userId);

    console.log('📊 [TEST] Réponse API:', {
      status: response.status,
      message: response.msg,
      dataLength: response.data?.length || 0
    });

    if (response.status === 200 && response.data && response.data.length > 0) {
      console.log('📦 [TEST] Exemple de première agence:', response.data[0]);

      // 2. Synchroniser en local
      console.log('💾 [TEST] Synchronisation vers la BD locale...');
      const count = await offlineAgenceApi.syncFromOnline(response.data);
      console.log(`✅ [TEST] ${count} agences synchronisées`);

      // 3. Vérifier en relisant
      console.log('🔍 [TEST] Vérification: lecture depuis la BD locale...');
      const agences = await offlineAgenceApi.getAll();
      console.log(`📦 [TEST] ${agences.length} agences trouvées en local`);

      if (agences.length > 0) {
        console.log('📦 [TEST] Exemple d\'agence en local:', agences[0]);
      }

      return { success: true, count: agences.length };
    } else {
      console.warn('⚠️ [TEST] Aucune agence retournée par l\'API');
      return { success: false, error: 'Pas de données' };
    }
  } catch (error: any) {
    console.error('❌ [TEST] Erreur:', error);
    return { success: false, error: error.message || error };
  }
}

/**
 * Test de synchronisation des destinations
 * @param agenceId - ID de l'agence
 */
export async function testSyncDestinations(agenceId: number) {
  console.log('🧪 [TEST] Début du test de synchronisation des destinations...');
  console.log('🏢 [TEST] Agence ID:', agenceId);

  try {
    // 1. Charger depuis l'API
    console.log('📡 [TEST] Appel API loadDest...');
    const response = await destinationApi.loadDest(agenceId);

    console.log('📊 [TEST] Réponse API:', {
      status: response.status,
      message: response.msg,
      dataLength: response.data?.length || 0
    });

    if (response.status === 200 && response.data && response.data.length > 0) {
      console.log('📦 [TEST] Exemple de première destination:', response.data[0]);

      // 2. Synchroniser en local
      console.log('💾 [TEST] Synchronisation vers la BD locale...');
      const count = await offlineDestinationApi.syncFromOnline(response.data);
      console.log(`✅ [TEST] ${count} destinations synchronisées`);

      // 3. Vérifier en relisant
      console.log('🔍 [TEST] Vérification: lecture depuis la BD locale...');
      const destinations = await offlineDestinationApi.getAll();
      console.log(`📦 [TEST] ${destinations.length} destinations trouvées en local`);

      if (destinations.length > 0) {
        console.log('📦 [TEST] Exemple de destination en local:', destinations[0]);
      }

      return { success: true, count: destinations.length };
    } else {
      console.warn('⚠️ [TEST] Aucune destination retournée par l\'API');
      return { success: false, error: 'Pas de données' };
    }
  } catch (error: any) {
    console.error('❌ [TEST] Erreur:', error);
    return { success: false, error: error.message || error };
  }
}

/**
 * Test complet
 */
export async function testCompletSync(userId: number, agenceId: number) {
  console.log('🧪 [TEST] ==========================================');
  console.log('🧪 [TEST] TEST COMPLET DE SYNCHRONISATION');
  console.log('🧪 [TEST] ==========================================');

  const results = {
    agences: await testSyncAgences(userId),
    destinations: await testSyncDestinations(agenceId),
  };

  console.log('🧪 [TEST] ==========================================');
  console.log('🧪 [TEST] RÉSULTATS:');
  console.log('🧪 [TEST] Agences:', results.agences);
  console.log('🧪 [TEST] Destinations:', results.destinations);
  console.log('🧪 [TEST] ==========================================');

  return results;
}

/**
 * Vérifier le contenu actuel de la BD
 */
export async function checkLocalData() {
  console.log('🔍 [CHECK] Vérification des données locales...');

  try {
    const agences = await offlineAgenceApi.getAll();
    const destinations = await offlineDestinationApi.getAll();

    console.log('📊 [CHECK] Résultats:');
    console.log(`   - Agences en BD: ${agences.length}`);
    console.log(`   - Destinations en BD: ${destinations.length}`);

    if (agences.length > 0) {
      console.log('📦 [CHECK] Exemples d\'agences:', agences.slice(0, 3));
    }

    if (destinations.length > 0) {
      console.log('📦 [CHECK] Exemples de destinations:', destinations.slice(0, 3));
    }

    return { agences, destinations };
  } catch (error) {
    console.error('❌ [CHECK] Erreur:', error);
    return null;
  }
}

/**
 * Diagnostic complet de la base de données
 */
export async function dbDiagnostic() {
  console.log('🔍 [DIAGNOSTIC] ==========================================');
  console.log('🔍 [DIAGNOSTIC] DIAGNOSTIC COMPLET DE LA BASE DE DONNÉES');
  console.log('🔍 [DIAGNOSTIC] ==========================================');

  try {
    const info = await diagnosticApi.getDbInfo();
    console.log('📊 [DIAGNOSTIC] Résultat:');
    console.log(info);

    // Vérifier aussi via les APIs
    const agences = await offlineAgenceApi.getAll();
    const destinations = await offlineDestinationApi.getAll();

    console.log('🔍 [DIAGNOSTIC] Vérification croisée:');
    console.log(`   - Agences (via API): ${agences.length}`);
    console.log(`   - Destinations (via API): ${destinations.length}`);

    return { info, agences, destinations };
  } catch (error) {
    console.error('❌ [DIAGNOSTIC] Erreur:', error);
    return null;
  }
}

// Exposer globalement pour utilisation dans la console
if (typeof window !== 'undefined') {
  (window as any).testSyncAgences = testSyncAgences;
  (window as any).testSyncDestinations = testSyncDestinations;
  (window as any).testCompletSync = testCompletSync;
  (window as any).checkLocalData = checkLocalData;
  (window as any).dbDiagnostic = dbDiagnostic;

  console.log('🧪 Fonctions de test disponibles dans la console:');
  console.log('   - dbDiagnostic()                    // Diagnostic complet BD');
  console.log('   - testSyncAgences(userId)           // Test sync agences');
  console.log('   - testSyncDestinations(agenceId)    // Test sync destinations');
  console.log('   - testCompletSync(userId, agenceId) // Test complet');
  console.log('   - checkLocalData()                  // Vérifier contenu BD');
}
