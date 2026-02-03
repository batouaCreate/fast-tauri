import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface UseTicketSyncOptions {
  userId: number | null;
  intervalMs?: number; // Intervalle de synchronisation en millisecondes
  enabled?: boolean; // Activer/désactiver la synchronisation automatique
  onSuccess?: (count: number) => void;
  onError?: (error: string) => void;
}

interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  lastSyncCount: number;
  error: string | null;
}

/**
 * Hook personnalisé pour synchroniser automatiquement les tickets d'un utilisateur
 * depuis le serveur vers la base de données locale en arrière-plan.
 *
 * @param options - Options de configuration
 * @returns État de la synchronisation et fonction pour forcer une synchronisation
 */
export function useTicketSync({
  userId,
  intervalMs = 5 * 60 * 1000, // Par défaut: 5 minutes
  enabled = true,
  onSuccess,
  onError,
}: UseTicketSyncOptions) {
  const [status, setStatus] = useState<SyncStatus>({
    isSyncing: false,
    lastSyncTime: null,
    lastSyncCount: 0,
    error: null,
  });

  const intervalRef = useRef<number | null>(null);
  const isFirstSync = useRef(true);

  /**
   * Fonction pour synchroniser les tickets
   */
  const syncTickets = async () => {
    if (!userId || status.isSyncing) {
      return;
    }

    try {
      setStatus((prev) => ({ ...prev, isSyncing: true, error: null }));

      console.log('🔄 [useTicketSync] Synchronisation des tickets pour l\'utilisateur:', userId);

      const count = await invoke<number>('sync_tickets_by_user', { userId });

      console.log('✅ [useTicketSync] Synchronisation réussie:', count, 'tickets');

      setStatus({
        isSyncing: false,
        lastSyncTime: new Date(),
        lastSyncCount: count,
        error: null,
      });

      onSuccess?.(count);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ [useTicketSync] Erreur de synchronisation:', errorMessage);

      setStatus((prev) => ({
        ...prev,
        isSyncing: false,
        error: errorMessage,
      }));

      onError?.(errorMessage);
    }
  };

  // Effet pour lancer la synchronisation automatique
  useEffect(() => {
    // Ne pas synchroniser si désactivé ou pas d'utilisateur
    if (!enabled || !userId) {
      return;
    }

    // Première synchronisation immédiate au montage
    if (isFirstSync.current) {
      console.log('🚀 [useTicketSync] Première synchronisation au montage du composant');
      syncTickets();
      isFirstSync.current = false;
    }

    // Configurer l'intervalle de synchronisation
    if (intervalMs > 0) {
      console.log('⏰ [useTicketSync] Configuration de la synchronisation automatique toutes les', intervalMs / 1000, 'secondes');

      intervalRef.current = window.setInterval(() => {
        console.log('⏰ [useTicketSync] Synchronisation automatique déclenchée');
        syncTickets();
      }, intervalMs);
    }

    // Nettoyer l'intervalle au démontage
    return () => {
      if (intervalRef.current !== null) {
        console.log('🛑 [useTicketSync] Arrêt de la synchronisation automatique');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [userId, enabled, intervalMs]);

  // Réinitialiser isFirstSync quand l'utilisateur change
  useEffect(() => {
    isFirstSync.current = true;
  }, [userId]);

  return {
    ...status,
    syncNow: syncTickets, // Fonction pour forcer une synchronisation manuelle
  };
}
