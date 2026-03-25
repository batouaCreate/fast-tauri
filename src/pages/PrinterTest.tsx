import React, { useState, useEffect } from 'react';
import { Printer, Upload, Check, AlertCircle } from 'lucide-react';
import { ThermalPrinter, TicketBuilder } from '../services/printer';
import { useToast } from '../contexts/ToastContext';

const PrinterTest: React.FC = () => {
  const { success: showSuccess, error: showError } = useToast();
  const [printers, setPrinters] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [logoBase64, setLogoBase64] = useState<string>('');
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadPrinters();
  }, []);

  const loadPrinters = async () => {
    try {
      console.log('Chargement des imprimantes...');
      const printerList = await ThermalPrinter.listPrinters();
      console.log('Imprimantes trouvées:', printerList);
      setPrinters(printerList);
      if (printerList.length > 0) {
        setSelectedPrinter(printerList[0]);
        console.log('Imprimante sélectionnée:', printerList[0]);
      } else {
        console.warn('Aucune imprimante trouvée');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des imprimantes:', error);
      showError('Erreur', `Impossible de charger les imprimantes: ${error}`);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await ThermalPrinter.imageToBase64(file);
      setLogoBase64(base64);

      // Créer une preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      showSuccess('Logo chargé', 'Le logo a été chargé avec succès');
    } catch (error) {
      showError('Erreur', 'Impossible de charger le logo');
    }
  };

  const printTransportTicket = async () => {
    if (!selectedPrinter) {
      showError('Erreur', 'Veuillez sélectionner une imprimante');
      return;
    }

    setIsLoading(true);
    try {
      const ticketData = TicketBuilder.createTransportTicket({
        ticketNumber: 'TK-2025-001',
        departure: 'Départ Test',
        departureStation: 'Gare d\'Abidjan',
        passenger: 'Jean BATOUA',
        phone: '+225 07 08 09 10 11',
        destination: 'BONGOUANOU',
        seatNumber: '12',
        date: new Date().toLocaleDateString('fr-FR'),
        time: '14:30',
        price: '5000 FCFA',
      });

      await ThermalPrinter.printTicket(selectedPrinter, ticketData, logoBase64 || undefined);
      showSuccess('Succès', 'Ticket imprimé avec succès!');
    } catch (error) {
      console.error('Erreur d\'impression:', error);
      showError('Erreur', `Échec de l'impression: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const printParcelReceipt = async () => {
    if (!selectedPrinter) {
      showError('Erreur', 'Veuillez sélectionner une imprimante');
      return;
    }

    setIsLoading(true);
    try {
      const ticketData = TicketBuilder.createParcelReceipt({
        trackingNumber: 'COL-2025-456',
        sender: 'Konan Kouassi',
        recipient: 'Yao Kouame',
        destination: 'Abidjan',
        weight: '5 kg',
        price: '3000 FCFA',
      });

      await ThermalPrinter.printTicket(selectedPrinter, ticketData, logoBase64 || undefined);
      showSuccess('Succès', 'Reçu imprimé avec succès!');
    } catch (error) {
      console.error('Erreur d\'impression:', error);
      showError('Erreur', `Échec de l'impression: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const printManifest = async () => {
    if (!selectedPrinter) {
      showError('Erreur', 'Veuillez sélectionner une imprimante');
      return;
    }

    setIsLoading(true);
    try {
      const ticketData = TicketBuilder.createManifest({
        manifestNumber: 'BDX-2025-789',
        driver: 'Koné Ibrahim',
        vehicle: 'AA-1234-CI',
        destination: 'Yamoussoukro',
        items: [
          { description: 'Colis fragile', quantity: '3' },
          { description: 'Valise', quantity: '5' },
          { description: 'Carton', quantity: '10' },
        ],
      });

      await ThermalPrinter.printTicket(selectedPrinter, ticketData, logoBase64 || undefined);
      showSuccess('Succès', 'Bordereau imprimé avec succès!');
    } catch (error) {
      console.error('Erreur d\'impression:', error);
      showError('Erreur', `Échec de l'impression: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Test d'impression thermique
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Testez l'impression de tickets avec votre imprimante thermique
        </p>
      </div>

      {/* Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Configuration
        </h2>

        {/* Sélection de l'imprimante */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Imprimante
          </label>
          <select
            value={selectedPrinter}
            onChange={(e) => setSelectedPrinter(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
          >
            {printers.length === 0 && (
              <option value="">Aucune imprimante détectée</option>
            )}
            {printers.map((printer) => (
              <option key={printer} value={printer}>
                {printer}
              </option>
            ))}
          </select>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Sur Windows: USB001, LPT1 | Sur Mac: thermal_printer | Sur Linux: lp0, lp1
          </p>
        </div>

        {/* Upload du logo */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Logo (optionnel)
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg cursor-pointer transition-colors">
              <Upload size={20} />
              <span>Choisir un logo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>
            {logoPreview && (
              <div className="flex items-center gap-2">
                <img
                  src={logoPreview}
                  alt="Logo"
                  className="h-12 w-12 object-contain border border-gray-200 dark:border-gray-600 rounded"
                />
                <Check className="text-green-500" size={20} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exemples d'impression */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Exemples d'impression
        </h2>

        {!selectedPrinter && (
          <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg mb-4">
            <AlertCircle size={20} />
            <span>Veuillez sélectionner une imprimante pour continuer</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Ticket de transport */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Ticket de Transport
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Impression d'un ticket de voyage avec passager, destination et siège
            </p>
            <button
              onClick={printTransportTicket}
              disabled={isLoading || !selectedPrinter}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <Printer size={18} />
              Imprimer
            </button>
          </div>

          {/* Reçu de colis */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Reçu de Colis
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Impression d'un reçu avec numéro de suivi et informations d'expédition
            </p>
            <button
              onClick={printParcelReceipt}
              disabled={isLoading || !selectedPrinter}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <Printer size={18} />
              Imprimer
            </button>
          </div>

          {/* Bordereau */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Bordereau
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Impression d'un bordereau avec liste d'articles et signature
            </p>
            <button
              onClick={printManifest}
              disabled={isLoading || !selectedPrinter}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <Printer size={18} />
              Imprimer
            </button>
          </div>
        </div>
      </div>

      {/* Notes techniques */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
          Notes techniques
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
          <li>Les commandes ESC/POS sont utilisées pour le formatage</li>
          <li>Le logo est automatiquement converti et redimensionné</li>
          <li>La coupure de papier est effectuée automatiquement</li>
          <li>Compatible avec la plupart des imprimantes thermiques 58mm et 80mm</li>
        </ul>
      </div>
    </div>
  );
};

export default PrinterTest;
