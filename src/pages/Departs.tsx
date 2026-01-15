import React, { useState, useEffect } from 'react';
import { Bus, Clock, MapPin, Loader2, RefreshCw } from 'lucide-react';
import TicketModal from '../components/TicketModal';
import DepartureFormModal from '../components/DepartureFormModal';
import BordereauBilletModal from '../components/BordereauBilletModal';
import BordereauColisModal from '../components/BordereauColisModal';
import BordereauBagageModal from '../components/BordereauBagageModal';
import { Departure } from '../services/api';
import { offlineDepartureApi, offlineAgenceApi, offlineTicketApi, OfflineDeparture } from '../services/offline-api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const Departs: React.FC = () => {
  const [selectedDeparture, setSelectedDeparture] = useState<Departure | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBordereauModalOpen, setIsBordereauModalOpen] = useState(false);
  const [isBordereauColisModalOpen, setIsBordereauColisModalOpen] = useState(false);
  const [isBordereauBagageModalOpen, setIsBordereauBagageModalOpen] = useState(false);
  const [selectedDepartureId, setSelectedDepartureId] = useState<number | null>(null);
  const [selectedColisDepId, setSelectedColisDepId] = useState<number | null>(null);
  const [selectedBagageDepId, setSelectedBagageDepId] = useState<number | null>(null);
  const [departs, setDeparts] = useState<Departure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { error: showError } = useToast();

  const loadDeparts = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      console.log('📡 [DEPARTS] Chargement des départs depuis la BD locale...');

      // Charger les agences pour obtenir les noms
      const agences = await offlineAgenceApi.getAll();
      const agencesMap = new Map(agences.map(ag => [ag.remote_id, ag.ag_nom]));

      // Charger depuis la base de données locale
      const offlineDeparts = await offlineDepartureApi.getAll(parseInt(user.id));
      console.log(`✅ [DEPARTS] ${offlineDeparts.length} départ(s) chargé(s) depuis la BD locale`);

      // Charger le nombre de tickets pour chaque départ
      const departsWithTickets = await Promise.all(
        offlineDeparts.map(async (dep: OfflineDeparture) => {
          let nbTickets = 0;
          try {
            // Charger les tickets pour ce départ
            const tickets = await offlineTicketApi.getByDeparture(dep.id || 0);
            nbTickets = tickets.length;
            console.log(`📊 [DEPARTS] Départ ${dep.dep_nom}: ${nbTickets} ticket(s) vendu(s)`);
          } catch (error) {
            console.warn(`⚠️ [DEPARTS] Impossible de charger les tickets pour le départ ${dep.id}:`, error);
          }

          return {
            dep_id: dep.id || 0,
            dep_ligne: dep.dep_ligne || '',
            dep_user: dep.dep_user,
            dep_numcar: dep.dep_numcar,
            dep_nom: dep.dep_nom,
            dep_dest: String(dep.dep_dest),
            dep_place: dep.dep_place,
            dep_chauff: dep.dep_chauff,
            dep_conv: dep.dep_conv,
            dep_date: dep.dep_date,
            dep_heure: dep.dep_heure,
            dep_fraisroute: dep.dep_fraisroute,
            dep_lavage: dep.dep_lavage,
            dep_carbur: dep.dep_carbur,
            dep_droitgare: dep.dep_droitgare,
            dep_autredep: dep.dep_autredep,
            dep_create: dep.created_at,
            ag_id: dep.ag_id,
            ag_etp: 0,
            ag_code: '',
            ag_nom: user.agence.name,
            ag_phone: '',
            ag_pays: '',
            ag_ville: '',
            ag_devise: user.agence.currency,
            ag_prefix: '',
            ag_stat: '',
            ag_create: '',
            us_id: dep.dep_user,
            us_agence: dep.ag_id,
            us_type: '',
            us_code: '',
            us_nom: user.name,
            us_email: '',
            us_phone: '',
            us_pass: '',
            us_stat: '',
            us_photo: '',
            us_device: '',
            us_printer: 0,
            us_create: '',
            dateDep: dep.dep_date,
            sumtick: null,
            agdest: agencesMap.get(Number(dep.dep_dest)) || `Destination ${dep.dep_dest}`,
            nbtick: nbTickets, // Nombre réel de tickets vendus depuis la BD locale
          } as Departure;
        })
      );

      setDeparts(departsWithTickets);
      console.log(`✅ [DEPARTS] Données complètes chargées avec le nombre de tickets`);
    } catch (error) {
      console.error('❌ [DEPARTS] Erreur lors du chargement des départs:', error);
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

  const handleBordereauBillet = (departId: number) => {
    setSelectedDepartureId(departId);
    setIsBordereauModalOpen(true);
  };

  const handleBordereauColis = (departId: number) => {
    setSelectedColisDepId(departId);
    setIsBordereauColisModalOpen(true);
  };

  const handleBordereauBagage = (departId: number) => {
    setSelectedBagageDepId(departId);
    setIsBordereauBagageModalOpen(true);
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

      {isLoading ? (
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary-500" size={40} />
          </div>
        </div>
      ) : departs.length === 0 ? (
        <div className="card text-center py-12">
          <Bus size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Aucun départ disponible
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Aucun départ n'est configuré pour le moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departs.map((depart) => (
            <div key={depart.dep_id} className="card hover:shadow-soft-lg transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white">
                    <Bus size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{depart.dep_nom}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Car: {depart.dep_numcar}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  depart.nbtick > 0
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                }`}>
                  {depart.nbtick}/{depart.dep_place}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-gray-400" />
                  <div className="flex-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{depart.ag_nom}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 mx-2">→</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{depart.agdest}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-gray-400" />
                  <div className="flex-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{depart.dateDep}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 mx-2">•</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{depart.dep_heure}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-800">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Chauffeur</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{depart.dep_chauff}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Bordereaux</h4>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleBordereauBillet(depart.dep_id)}
                    className="px-3 py-2 rounded-lg text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                  >
                    Billet
                  </button>
                  <button
                    onClick={() => handleBordereauColis(depart.dep_id)}
                    className="px-3 py-2 rounded-lg text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                  >
                    Colis
                  </button>
                  <button
                    onClick={() => handleBordereauBagage(depart.dep_id)}
                    className="px-3 py-2 rounded-lg text-xs font-medium bg-purple-500 hover:bg-purple-600 text-white transition-colors"
                  >
                    Bagage
                  </button>
                </div>
                <button
                  onClick={() => handleVendreTicket(depart)}
                  className="w-full btn-primary"
                >
                  Vendre Ticket
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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

      {/* Modal bordereau billet */}
      {selectedDepartureId && (
        <BordereauBilletModal
          isOpen={isBordereauModalOpen}
          onClose={() => setIsBordereauModalOpen(false)}
          departId={selectedDepartureId}
        />
      )}

      {/* Modal bordereau colis */}
      {selectedColisDepId && (
        <BordereauColisModal
          isOpen={isBordereauColisModalOpen}
          onClose={() => setIsBordereauColisModalOpen(false)}
          departId={selectedColisDepId}
        />
      )}

      {/* Modal bordereau bagage */}
      {selectedBagageDepId && (
        <BordereauBagageModal
          isOpen={isBordereauBagageModalOpen}
          onClose={() => setIsBordereauBagageModalOpen(false)}
          departId={selectedBagageDepId}
        />
      )}
    </div>
  );
};

export default Departs;
