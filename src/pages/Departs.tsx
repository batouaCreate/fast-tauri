import React, { useState, useEffect } from 'react';
import { Bus, Clock, MapPin, Loader2, RefreshCw } from 'lucide-react';
import TicketModal from '../components/TicketModal';
import DepartureFormModal from '../components/DepartureFormModal';
import { departureApi, Departure } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const Departs: React.FC = () => {
  const [selectedDeparture, setSelectedDeparture] = useState<Departure | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [departs, setDeparts] = useState<Departure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { error: showError } = useToast();

  const loadDeparts = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const response = await departureApi.loadAllDepartures(parseInt(user.id));
      setDeparts(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des départs:', error);
      showError('Erreur', 'Impossible de charger les départs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeparts();
  }, [user]);

  const handleVendreTicket = (depart: Departure) => {
    setSelectedDeparture(depart);
    setIsModalOpen(true);
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Départs</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isLoading ? 'Chargement...' : `${departs.length} départ(s) disponible(s)`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadDeparts}
            disabled={isLoading}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            Actualiser
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary"
          >
            Nouveau départ
          </button>
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary-500" size={40} />
          </div>
        ) : departs.length === 0 ? (
          <div className="text-center py-12">
            <Bus size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Aucun départ disponible</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Car</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Nom</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Gare</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Destination</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Heure</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Places</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Tickets</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Chauffeur</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {departs.map((depart) => (
                  <tr key={depart.dep_id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Bus size={18} className="text-primary-500" />
                        <span className="font-medium text-gray-900 dark:text-white">{depart.dep_numcar}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-900 dark:text-white">{depart.dep_nom}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-900 dark:text-white">{depart.ag_nom}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-gray-400" />
                        <span className="text-gray-900 dark:text-white">{depart.agdest}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-900 dark:text-white">{depart.dateDep}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-400" />
                        <span className="text-gray-900 dark:text-white">{depart.dep_heure}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-semibold">
                        {depart.dep_place}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        depart.nbtick > 0
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                      }`}>
                        {depart.nbtick} / {depart.dep_place}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-900 dark:text-white">{depart.dep_chauff}</span>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleVendreTicket(depart)}
                        className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Vendre Ticket
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de vente de ticket */}
      {selectedDeparture && (
        <TicketModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          departure={selectedDeparture}
        />
      )}

      {/* Modal de création de départ */}
      <DepartureFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadDeparts}
      />
    </div>
  );
};

export default Departs;
