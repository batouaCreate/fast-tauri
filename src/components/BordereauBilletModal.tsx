import React, { useState, useEffect } from 'react';
import { X, Printer, Loader2 } from 'lucide-react';
import { ThermalPrinter } from '../services/printer';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { offlineDepartureApi, offlineTicketApi, offlineDestinationApi } from '../services/offline-api';
import type { OfflineDeparture, OfflineTicket } from '../services/offline-api';

interface BordereauBilletModalProps {
  isOpen: boolean;
  onClose: () => void;
  departId: number;
}

interface TicketsByDestination {
  dest_id: number;
  dest_ville: string;
  nombre_tickets: number;
  montant_total: number;
}

const BordereauBilletModal: React.FC<BordereauBilletModalProps> = ({
  isOpen,
  onClose,
  departId,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [departure, setDeparture] = useState<OfflineDeparture | null>(null);
  const [tickets, setTickets] = useState<OfflineTicket[]>([]);
  const [ticketsByDestination, setTicketsByDestination] = useState<TicketsByDestination[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [printers, setPrinters] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadBordereauData();
      loadPrinters();
    }
  }, [isOpen, user, departId]);

  const loadBordereauData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      console.log('📊 [BORDEREAU] Chargement du départ et des tickets depuis la BD locale...');

      // Charger le départ
      const departureData = await offlineDepartureApi.getById(departId);
      setDeparture(departureData);
      console.log('✅ [BORDEREAU] Départ chargé:', departureData);

      // Charger les tickets pour ce départ
      const ticketsData = await offlineTicketApi.getByDeparture(departId);
      setTickets(ticketsData);
      console.log('✅ [BORDEREAU] Tickets chargés:', ticketsData.length);

      // Charger les destinations
      const agenceId = parseInt(localStorage.getItem('agenceId') || user.agence.id.toString());
      const destinationsData = await offlineDestinationApi.getByAgence(agenceId);
      console.log('✅ [BORDEREAU] Destinations chargées:', destinationsData.length);

      // Créer un map des destinations pour un accès rapide
      const destMap = new Map<number, string>();
      destinationsData.forEach(dest => {
        if (dest.remote_id) {
          destMap.set(dest.remote_id, dest.dest_ville);
        }
      });

      // Regrouper les tickets par destination
      const groupedTickets = new Map<number, { nombre: number; montant: number; ville: string }>();
      let total = 0;

      ticketsData.forEach(ticket => {
        const destId = ticket.tick_dest;
        const destVille = destMap.get(destId) || `Destination ${destId}`;
        const prix = parseFloat(ticket.tick_price);
        const reduction = ticket.tick_reduc || 0;
        const montantFinal = prix - reduction;

        if (groupedTickets.has(destId)) {
          const existing = groupedTickets.get(destId)!;
          groupedTickets.set(destId, {
            nombre: existing.nombre + 1,
            montant: existing.montant + montantFinal,
            ville: destVille,
          });
        } else {
          groupedTickets.set(destId, {
            nombre: 1,
            montant: montantFinal,
            ville: destVille,
          });
        }

        total += montantFinal;
      });

      // Convertir en tableau pour l'affichage
      const ticketsByDest: TicketsByDestination[] = Array.from(groupedTickets.entries()).map(
        ([dest_id, data]) => ({
          dest_id,
          dest_ville: data.ville,
          nombre_tickets: data.nombre,
          montant_total: data.montant,
        })
      );

      setTicketsByDestination(ticketsByDest);
      setTotalAmount(total);
      console.log('✅ [BORDEREAU] Tickets groupés par destination:', ticketsByDest);
      console.log('✅ [BORDEREAU] Montant total:', total);
    } catch (error: any) {
      console.error('❌ [BORDEREAU] Erreur lors du chargement du bordereau:', error);
      showToast('error', 'Erreur', error.message || 'Impossible de charger le bordereau');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPrinters = async () => {
    try {
      const printerList = await ThermalPrinter.listPrinters();
      setPrinters(printerList);
      if (printerList.length > 0) {
        setSelectedPrinter(printerList[0]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des imprimantes:', error);
      showToast('error', 'Erreur', 'Impossible de charger les imprimantes');
    }
  };

  const handlePrint = async () => {
    if (!departure || !selectedPrinter) {
      showToast('error', 'Erreur', 'Veuillez sélectionner une imprimante');
      return;
    }

    try {
      setIsPrinting(true);

      // Préparer les données pour l'impression avec le regroupement par destination
      const destinationItems = ticketsByDestination.map(dest => ({
        label: `${dest.dest_ville} (${dest.nombre_tickets} ticket${dest.nombre_tickets > 1 ? 's' : ''})`,
        value: dest.montant_total === 0 ? 'GRATUIT' : `${dest.montant_total.toFixed(0)} FCFA`,
      }));

      // Récupérer l'agence de départ (à partir de departure.ag_id si disponible)
      const agenceDepart = user?.agence.name || 'Agence';

      const ticketData = {
        title: 'BORDEREAU BILLET',
        items: [
          { label: 'Départ', value: agenceDepart },
          { label: 'Nom départ', value: departure.dep_nom },
          { label: 'Date et heure', value: `${departure.dep_date} ${departure.dep_heure}` },
          { label: 'Sièges vendus', value: `${tickets.length}/${departure.dep_place}` },
          { label: '', value: '' },
          { label: '--- BILLETS PAR DESTINATION ---', value: '' },
          ...destinationItems,
        ],
        total: `TOTAL: ${totalAmount.toFixed(0)} FCFA`,
        footer: [
          `Chauffeur: ${departure.dep_chauff || 'N/A'}`,
          `Car: ${departure.dep_numcar || 'N/A'}`,
          new Date().toLocaleString('fr-FR'),
        ],
      };

      await ThermalPrinter.printTicket(selectedPrinter, ticketData, undefined, 200);

      showToast('success', 'Succès', 'Bordereau imprimé avec succès');
      onClose();
    } catch (error: any) {
      console.error('Erreur lors de l\'impression:', error);
      showToast('error', 'Erreur', error.message || 'Erreur lors de l\'impression');
    } finally {
      setIsPrinting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Bordereau Billet
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary-500" size={40} />
            </div>
          ) : departure ? (
            <div className="space-y-6">
              {/* Sélection de l'imprimante */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Sélectionner une imprimante
                </h3>
                <select
                  value={selectedPrinter}
                  onChange={(e) => setSelectedPrinter(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Sélectionner une imprimante</option>
                  {printers.map((printer) => (
                    <option key={printer} value={printer}>
                      {printer}
                    </option>
                  ))}
                </select>
              </div>

              {/* Informations du départ */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Informations du départ
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Agence de départ</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user?.agence.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Nom du départ</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {departure.dep_nom}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Date et heure</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {departure.dep_date} à {departure.dep_heure}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Sièges vendus</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {tickets.length} / {departure.dep_place}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Chauffeur</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {departure.dep_chauff || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Numéro de car</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {departure.dep_numcar || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tickets par destination */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Billets par destination ({tickets.length} billet{tickets.length > 1 ? 's' : ''})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200 dark:border-gray-800">
                      <tr>
                        <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Destination
                        </th>
                        <th className="text-center py-2 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Nombre de tickets
                        </th>
                        <th className="text-right py-2 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Montant total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {ticketsByDestination.map((dest) => (
                        <tr
                          key={dest.dest_id}
                          className="border-b border-gray-100 dark:border-gray-800"
                        >
                          <td className="py-3 px-4 text-gray-900 dark:text-white">
                            {dest.dest_ville}
                          </td>
                          <td className="py-3 px-4 text-center text-gray-900 dark:text-white font-medium">
                            {dest.nombre_tickets}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900 dark:text-white font-medium">
                            {dest.montant_total === 0 ? (
                              <span className="text-green-600 dark:text-green-400">GRATUIT</span>
                            ) : (
                              `${dest.montant_total.toFixed(0)} FCFA`
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-gray-300 dark:border-gray-700">
                      <tr>
                        <td className="py-3 px-4 text-gray-900 dark:text-white font-bold">
                          TOTAL
                        </td>
                        <td className="py-3 px-4 text-center text-gray-900 dark:text-white font-bold">
                          {tickets.length}
                        </td>
                        <td className="py-3 px-4 text-right text-primary-600 dark:text-primary-400 font-bold text-lg">
                          {totalAmount.toFixed(0)} FCFA
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                Aucune donnée disponible
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={isPrinting}
          >
            Annuler
          </button>
          <button
            onClick={handlePrint}
            disabled={isPrinting || !selectedPrinter || !departure}
            className="btn-primary flex items-center gap-2"
          >
            {isPrinting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Impression...
              </>
            ) : (
              <>
                <Printer size={18} />
                Imprimer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BordereauBilletModal;
