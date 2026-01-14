import React, { useEffect, useState } from 'react';
import { syncApi, SyncStatus as SyncStatusType } from '../services/offline-api';
import { RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export const SyncStatus: React.FC = () => {
  const [status, setStatus] = useState<SyncStatusType | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadStatus = async () => {
    try {
      const syncStatus = await syncApi.getStatus();
      setStatus(syncStatus);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erreur chargement statut sync:', error);
    }
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await syncApi.forceSync();
      // Recharger le statut après quelques secondes
      setTimeout(() => {
        loadStatus();
        setIsSyncing(false);
      }, 2000);
    } catch (error) {
      console.error('Erreur forçage sync:', error);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadStatus();

    // Recharger le statut toutes les 10 secondes
    const interval = setInterval(loadStatus, 10000);

    return () => clearInterval(interval);
  }, []);

  if (!status) {
    return null;
  }

  const totalPending = status.pending_departures + status.pending_tickets;
  const totalErrors = status.error_departures + status.error_tickets;
  const hasIssues = totalPending > 0 || totalErrors > 0;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border-2 ${
        totalErrors > 0 ? 'border-red-500' :
        totalPending > 0 ? 'border-yellow-500' :
        'border-green-500'
      }`}>
        <div className="flex items-center gap-3 mb-2">
          <div className="relative">
            {isSyncing ? (
              <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
            ) : totalErrors > 0 ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : totalPending > 0 ? (
              <Clock className="w-5 h-5 text-yellow-500" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">
              {totalErrors > 0 ? 'Erreurs de synchronisation' :
               totalPending > 0 ? 'Synchronisation en attente' :
               'Tout est synchronisé'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
        </div>

        {hasIssues && (
          <div className="space-y-1 mb-3 text-xs">
            {status.pending_departures > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Départs en attente:</span>
                <span className="font-semibold text-yellow-600">{status.pending_departures}</span>
              </div>
            )}
            {status.pending_tickets > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tickets en attente:</span>
                <span className="font-semibold text-yellow-600">{status.pending_tickets}</span>
              </div>
            )}
            {status.error_departures > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Erreurs départs:</span>
                <span className="font-semibold text-red-600">{status.error_departures}</span>
              </div>
            )}
            {status.error_tickets > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Erreurs tickets:</span>
                <span className="font-semibold text-red-600">{status.error_tickets}</span>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleForceSync}
          disabled={isSyncing}
          className={`w-full py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            isSyncing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isSyncing ? 'Synchronisation...' : 'Forcer la synchronisation'}
        </button>
      </div>
    </div>
  );
};
