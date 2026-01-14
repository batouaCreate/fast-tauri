import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Gare } from '../services/api';
import { offlineAgenceApi, offlineDepartureApi } from '../services/offline-api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface DepartureFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface DepartureFormData {
  departureNumber: string;
  destination: string;
  numberOfSeats: number;
  busNumber: string;
  driver: string;
  attendant: string;
  departureDate: string;
  departureTime: string;
}

const DepartureFormModal: React.FC<DepartureFormModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();

  const [formData, setFormData] = useState<DepartureFormData>({
    departureNumber: '',
    destination: '',
    numberOfSeats: 0,
    busNumber: '',
    driver: '',
    attendant: '',
    departureDate: '',
    departureTime: '',
  });

  const [gares, setGares] = useState<Gare[]>([]);
  const [isLoadingGares, setIsLoadingGares] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Charger les gares de destination
  useEffect(() => {
    if (isOpen && user) {
      loadGares();
    }
  }, [isOpen, user]);

  const loadGares = async () => {
    if (!user) return;

    try {
      setIsLoadingGares(true);
      console.log('📡 [DEPARTURE FORM] Chargement des agences depuis la BD locale...');

      // Charger depuis la base de données locale
      const agences = await offlineAgenceApi.getAll();
      console.log(`✅ [DEPARTURE FORM] ${agences.length} agences chargées depuis la BD locale`);

      // Convertir les agences offline en format Gare pour compatibilité
      const garesData: Gare[] = agences.map(agence => ({
        ag_id: agence.remote_id || 0,
        ag_etp: 0,
        ag_code: agence.ag_code || '',
        ag_nom: agence.ag_nom,
        ag_phone: agence.ag_phone || '',
        ag_pays: agence.ag_pays || '',
        ag_ville: agence.ag_ville || '',
        ag_devise: agence.ag_devise || '',
        ag_prefix: agence.ag_prefix || '',
        ag_stat: agence.ag_stat || '',
        ag_create: agence.created_at,
      }));

      setGares(garesData);
    } catch (error) {
      console.error('❌ [DEPARTURE FORM] Erreur lors du chargement des gares:', error);
      showError('Erreur', 'Impossible de charger les destinations');
    } finally {
      setIsLoadingGares(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'numberOfSeats' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation des champs obligatoires
    if (!formData.departureNumber || !formData.destination || !formData.numberOfSeats ||
        !formData.departureDate || !formData.departureTime) {
      showError('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!user) {
      showError('Erreur', 'Utilisateur non connecté');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('💾 [DEPARTURE FORM] Création du départ en local...');

      // Créer le départ dans la base de données locale
      const departure = await offlineDepartureApi.create({
        user: parseInt(user.id),
        dep: formData.departureNumber,
        dest: parseInt(formData.destination),
        place: formData.numberOfSeats,
        car: formData.busNumber,
        chauff: formData.driver,
        conv: formData.attendant,
        datedep: formData.departureDate,
        hdep: formData.departureTime,
      }, user.agence.id);

      console.log('✅ [DEPARTURE FORM] Départ créé en local:', departure);
      showSuccess('Succès', 'Départ créé avec succès (sera synchronisé automatiquement)');
      onSuccess();
      onClose();

      // Réinitialiser le formulaire
      setFormData({
        departureNumber: '',
        destination: '',
        numberOfSeats: 0,
        busNumber: '',
        driver: '',
        attendant: '',
        departureDate: '',
        departureTime: '',
      });
    } catch (error: any) {
      console.error('❌ [DEPARTURE FORM] Erreur lors de la création du départ:', error);
      showError('Erreur', error.message || 'Impossible de créer le départ');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Nouveau Départ</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Numéro du départ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Numéro du départ
              </label>
              <select
                name="departureNumber"
                value={formData.departureNumber}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M5 7.5L10 12.5L15 7.5' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1.25rem',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="">Sélectionner un numéro de départ</option>
                {Array.from({ length: 50 }, (_, i) => i + 1).map(num => (
                  <option key={num} value={`DEPART ${num}`}>
                    DEPART {num}
                  </option>
                ))}
              </select>
            </div>

            {/* Destination */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Destination
              </label>
              {isLoadingGares ? (
                <div className="flex items-center justify-center py-3">
                  <Loader2 className="animate-spin text-primary-500" size={20} />
                  <span className="ml-2 text-gray-600 dark:text-gray-400">Chargement des destinations...</span>
                </div>
              ) : (
                <select
                  name="destination"
                  value={formData.destination}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M5 7.5L10 12.5L15 7.5' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '1.25rem',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="">Sélectionner une destination</option>
                  {gares.map(gare => (
                    <option key={gare.ag_id} value={gare.ag_id}>
                      {gare.ag_nom} - {gare.ag_ville}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Nombre de places */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre de places
              </label>
              <input
                type="number"
                name="numberOfSeats"
                value={formData.numberOfSeats || ''}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ex: 45"
              />
            </div>

            {/* Numéro de car */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Numéro de car <span className="text-gray-400 text-xs">(optionnel)</span>
              </label>
              <input
                type="text"
                name="busNumber"
                value={formData.busNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ex: BUS-001"
              />
            </div>

            {/* Chauffeur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Chauffeur <span className="text-gray-400 text-xs">(optionnel)</span>
              </label>
              <input
                type="text"
                name="driver"
                value={formData.driver}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Nom du chauffeur"
              />
            </div>

            {/* Convoyeur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Convoyeur <span className="text-gray-400 text-xs">(optionnel)</span>
              </label>
              <input
                type="text"
                name="attendant"
                value={formData.attendant}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Nom du convoyeur"
              />
            </div>

            {/* Date et Heure */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date départ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date de départ
                </label>
                <input
                  type="date"
                  name="departureDate"
                  value={formData.departureDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Heure départ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Heure de départ
                </label>
                <input
                  type="time"
                  name="departureTime"
                  value={formData.departureTime}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Création en cours...
                </>
              ) : (
                'Créer le départ'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepartureFormModal;
