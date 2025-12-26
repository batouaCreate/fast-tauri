import React, { useState, useEffect } from 'react';
import { X, Printer, Loader2 } from 'lucide-react';
import { bordereauApi, BordereauBilletData } from '../services/api';
import { ThermalPrinter } from '../services/printer';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface BordereauBilletModalProps {
  isOpen: boolean;
  onClose: () => void;
  departId: number;
}

const BordereauBilletModal: React.FC<BordereauBilletModalProps> = ({
  isOpen,
  onClose,
  departId,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [bordereauData, setBordereauData] = useState<BordereauBilletData | null>(null);
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
      const agenceId = parseInt(localStorage.getItem('agenceId') || user.agence.id.toString());
      const response = await bordereauApi.getBordBillet(
        parseInt(user.id),
        agenceId,
        departId
      );
      setBordereauData(response.data);
    } catch (error: any) {
      console.error('Erreur lors du chargement du bordereau:', error);
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
    if (!bordereauData || !selectedPrinter) {
      showToast('error', 'Erreur', 'Veuillez sélectionner une imprimante');
      return;
    }

    try {
      setIsPrinting(true);

      const depart = bordereauData.depart[0];

      // Télécharger le logo si disponible
      let logoBase64: string | undefined;
      if (depart.etp_img) {
        try {
          logoBase64 = await ThermalPrinter.urlToBase64(depart.etp_img);
        } catch (error) {
          console.warn('Impossible de charger le logo:', error);
        }
      }

      // Préparer les données pour l'impression
      const ticketItems = bordereauData.tickets.map(ticket => {
        const prixFinal = parseFloat(ticket.tick_price) - (ticket.tick_reduc || 0);
        return {
          label: `${ticket.dest_ville} - Siège ${ticket.tick_siege}`,
          value: prixFinal === 0 ? 'GRATUIT' : `${prixFinal} FCFA`,
        };
      });

      const ticketData = {
        title: 'BORDEREAU BILLET',
        items: [
          { label: 'Départ', value: `${depart.ag_nom} => ${depart.agdest}` },
          { label: 'Nom départ', value: depart.dep_nom },
          { label: 'Date et heure', value: `${depart.dep_date} ${depart.dep_heure}` },
          { label: 'Sièges vendus', value: `${bordereauData.cptick}/${depart.dep_place}` },
          { label: '', value: '' },
          { label: '--- BILLETS ---', value: '' },
          ...ticketItems,
        ],
        total: `TOTAL: ${bordereauData.stattick.tot_ticket} FCFA`,
        footer: [
          `Chauffeur: ${depart.dep_chauff}`,
          `Car: ${depart.dep_numcar}`,
          new Date().toLocaleString('fr-FR'),
        ],
      };

      await ThermalPrinter.printTicket(selectedPrinter, ticketData, logoBase64, 200);

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
          ) : bordereauData ? (
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">Départ et Destination</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {bordereauData.depart[0]?.ag_nom} → {bordereauData.depart[0]?.agdest}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Nom du départ</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {bordereauData.depart[0]?.dep_nom}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Date et heure</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {bordereauData.depart[0]?.dep_date} à {bordereauData.depart[0]?.dep_heure}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Sièges vendus</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {bordereauData.cptick} / {bordereauData.depart[0]?.dep_place}
                    </p>
                  </div>
                </div>
              </div>

              {/* Liste des tickets */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Liste des billets ({bordereauData.tickets.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200 dark:border-gray-800">
                      <tr>
                        <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Destination
                        </th>
                        <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Siège
                        </th>
                        <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Prix
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {bordereauData.tickets.map((ticket, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-100 dark:border-gray-800"
                        >
                          <td className="py-2 px-4 text-gray-900 dark:text-white">
                            {ticket.dest_ville}
                          </td>
                          <td className="py-2 px-4 text-gray-900 dark:text-white">
                            {ticket.tick_siege}
                          </td>
                          <td className="py-2 px-4 text-gray-900 dark:text-white">
                            {(() => {
                              const prixFinal = parseFloat(ticket.tick_price) - (ticket.tick_reduc || 0);
                              return prixFinal === 0 ? 'GRATUIT' : `${prixFinal} FCFA`;
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
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
            disabled={isPrinting || !selectedPrinter || !bordereauData}
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
