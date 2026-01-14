import React, { useState, useEffect } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Destination } from '../services/api';
import { offlineDestinationApi } from '../services/offline-api';
import { useToast } from '../contexts/ToastContext';
import DestinationFormModal from '../components/DestinationFormModal';

const Destinations: React.FC = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadDestinations();
  }, []);

  const loadDestinations = async () => {
    try {
      setLoading(true);
      const agenceId = localStorage.getItem('agenceId');

      if (!agenceId) {
        showToast('error', 'Erreur', 'ID de l\'agence non trouvé');
        return;
      }

      console.log('📡 [DESTINATIONS] Chargement des destinations depuis la BD locale...');

      // Charger depuis la base de données locale
      const offlineDestinations = await offlineDestinationApi.getByAgence(parseInt(agenceId));
      console.log(`✅ [DESTINATIONS] ${offlineDestinations.length} destination(s) chargée(s)`);

      // Convertir en format Destination
      const destinationsData: Destination[] = offlineDestinations.map(dest => ({
        dest_id: dest.remote_id || 0,
        dest_user: dest.dest_user,
        dest_agence: dest.dest_agence,
        dest_ville: dest.dest_ville,
        dest_price: dest.dest_price,
        dest_create: dest.created_at,
      }));

      setDestinations(destinationsData);
    } catch (error: any) {
      console.error('❌ [DESTINATIONS] Erreur lors du chargement des destinations:', error);
      showToast('error', 'Erreur', error.message || 'Erreur lors du chargement des destinations');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    loadDestinations();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement des destinations...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Destinations</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestion des destinations desservies ({destinations.length} destination{destinations.length > 1 ? 's' : ''})
          </p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          Nouvelle destination
        </button>
      </div>

      {destinations.length === 0 ? (
        <div className="card text-center py-12">
          <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Aucune destination trouvée
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Aucune destination n'est configurée pour cette agence.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((dest) => (
            <div key={dest.dest_id} className="card hover:shadow-soft-lg transition-all duration-200 cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{dest.dest_ville}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">ID: {dest.dest_id}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Prix</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{dest.dest_price} FCFA</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Créé le</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(dest.dest_create).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex gap-2">
                <button className="flex-1 btn-primary flex items-center justify-center gap-2">
                  <Navigation size={16} />
                  Voir l'itinéraire
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal pour ajouter une destination */}
      <DestinationFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default Destinations;
