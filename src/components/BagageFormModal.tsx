import React, { useState, useEffect } from 'react';
import { X, Briefcase, User, FileText, MapPin } from 'lucide-react';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { CreateBagageRequest, bagageApi, departureApi, gareApi, Departure, Gare } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface BagageFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const NATURES = [
  'DOCUMENT',
  'BIJOUX',
  'TEXTILE',
  'PRODUIT DE BEAUTE',
  'APPAREIL',
  'DENREE',
  'MEDICAMENT',
  'MATERIEL',
  'AUTRE'
];

const BagageFormModal: React.FC<BagageFormModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();

  const [departures, setDepartures] = useState<Departure[]>([]);
  const [gares, setGares] = useState<Gare[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [formData, setFormData] = useState<CreateBagageRequest>({
    user: 0,
    depart: 0,
    nature: 'DOCUMENT',
    frais: 0,
    desc: '',
    valeur: 0,
    exp: '',
    phonexp: '',
    siege: 0,
    dest: 0,
  });

  // Charger les départs et les gares
  useEffect(() => {
    if (isOpen && user) {
      loadData();
    }
  }, [isOpen, user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setIsLoadingData(true);

      // Charger les départs et les gares en parallèle
      const [departuresResponse, garesResponse] = await Promise.all([
        departureApi.loadAllDepartures(parseInt(user.id)),
        gareApi.loadGareDest(parseInt(user.id))
      ]);

      setDepartures(departuresResponse.data);
      setGares(garesResponse.data);

      // Définir l'utilisateur dans formData
      setFormData(prev => ({ ...prev, user: parseInt(user.id) }));
    } catch (error: any) {
      console.error('Erreur lors du chargement des données:', error);
      showError('Erreur', error.message || 'Impossible de charger les données');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleInputChange = (field: keyof CreateBagageRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showError('Erreur', 'Utilisateur non connecté');
      return;
    }

    // Validation
    if (!formData.depart) {
      showError('Erreur', 'Veuillez sélectionner un départ');
      return;
    }

    if (!formData.dest) {
      showError('Erreur', 'Veuillez sélectionner une destination');
      return;
    }

    if (formData.valeur <= 0) {
      showError('Erreur', 'La valeur doit être supérieure à 0');
      return;
    }

    if (formData.frais <= 0) {
      showError('Erreur', 'Les frais doivent être supérieurs à 0');
      return;
    }

    if (!formData.exp.trim()) {
      showError('Erreur', 'Veuillez entrer le nom du voyageur');
      return;
    }

    // Validation du téléphone voyageur : optionnel, mais si renseigné doit avoir au moins 8 chiffres
    const phonexpDigits = formData.phonexp.replace(/\D/g, '');
    if (phonexpDigits.length > 0 && phonexpDigits.length < 8) {
      showError('Erreur', 'Veuillez entrer un numéro de téléphone voyageur valide (minimum 8 chiffres)');
      return;
    }

    if (formData.siege <= 0) {
      showError('Erreur', 'Veuillez entrer un numéro de siège valide');
      return;
    }

    try {
      setIsLoading(true);

      const response = await bagageApi.createBagage(formData);

      showSuccess('Succès', response.msg || 'Bagage créé avec succès');

      // Réinitialiser le formulaire
      setFormData({
        user: parseInt(user.id),
        depart: 0,
        nature: 'DOCUMENT',
        frais: 0,
        desc: '',
        valeur: 0,
        exp: '',
        phonexp: '',
        siege: 0,
        dest: 0,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erreur lors de la création du bagage:', error);
      showError('Erreur', error.message || 'Impossible de créer le bagage');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Nouveau Bagage</h2>
            <p className="text-primary-100">Créer un nouveau bagage pour un voyageur</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isLoadingData ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informations du bagage */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Informations du bagage
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Départ */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Départ *
                    </label>
                    <select
                      value={formData.depart}
                      onChange={(e) => handleInputChange('depart', parseInt(e.target.value))}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M5 7.5L10 12.5L15 7.5' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.75rem center',
                        backgroundSize: '1.25rem',
                        paddingRight: '2.5rem'
                      }}
                      required
                    >
                      <option value={0}>Sélectionner un départ</option>
                      {departures.map((dep) => (
                        <option key={dep.dep_id} value={dep.dep_id}>
                          {dep.agdest} - {dep.dep_heure} - {dep.dep_numcar}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Nature */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nature *
                    </label>
                    <select
                      value={formData.nature}
                      onChange={(e) => handleInputChange('nature', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M5 7.5L10 12.5L15 7.5' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.75rem center',
                        backgroundSize: '1.25rem',
                        paddingRight: '2.5rem'
                      }}
                      required
                    >
                      {NATURES.map((nature) => (
                        <option key={nature} value={nature}>
                          {nature}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Valeur - AVANT Frais selon les instructions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Valeur du bagage (FCFA) *
                    </label>
                    <input
                      type="number"
                      value={formData.valeur || ''}
                      onChange={(e) => handleInputChange('valeur', parseInt(e.target.value) || 0)}
                      placeholder="35000"
                      min="0"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Frais */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Frais (FCFA) *
                    </label>
                    <input
                      type="number"
                      value={formData.frais || ''}
                      onChange={(e) => handleInputChange('frais', parseInt(e.target.value) || 0)}
                      placeholder="1500"
                      min="0"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Destination */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Destination *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <select
                        value={formData.dest}
                        onChange={(e) => handleInputChange('dest', parseInt(e.target.value))}
                        className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none cursor-pointer"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M5 7.5L10 12.5L15 7.5' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 0.75rem center',
                          backgroundSize: '1.25rem',
                          paddingRight: '2.5rem'
                        }}
                        required
                      >
                        <option value={0}>Sélectionner une destination</option>
                        {gares.map((gare) => (
                          <option key={gare.ag_id} value={gare.ag_id}>
                            {gare.ag_nom} - {gare.ag_ville}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description du bagage
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 text-gray-400" size={20} />
                      <textarea
                        value={formData.desc}
                        onChange={(e) => handleInputChange('desc', e.target.value)}
                        placeholder="Sac d'igname..."
                        rows={3}
                        className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations voyageur */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Informations du voyageur
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nom voyageur */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nom et prénom *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        value={formData.exp}
                        onChange={(e) => handleInputChange('exp', e.target.value)}
                        placeholder="Kouadio Bernard"
                        className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  {/* Téléphone voyageur */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Téléphone *
                    </label>
                    <PhoneInput
                      defaultCountry="ci"
                      value={formData.phonexp}
                      onChange={(phone) => handleInputChange('phonexp', phone)}
                      inputClassName="w-full"
                      className="phone-input-custom"
                    />
                  </div>

                  {/* Siège */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Numéro de siège *
                    </label>
                    <input
                      type="number"
                      value={formData.siege || ''}
                      onChange={(e) => handleInputChange('siege', parseInt(e.target.value) || 0)}
                      placeholder="3"
                      min="1"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 btn-secondary"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Création...
                    </>
                  ) : (
                    <>
                      <Briefcase size={20} />
                      Créer le bagage
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default BagageFormModal;
