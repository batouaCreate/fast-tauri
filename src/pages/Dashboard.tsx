import React, { useState, useEffect } from 'react';
import { Package, Briefcase, Calendar, RefreshCw, Ticket, DollarSign, Bus } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { dashboardApi, DashboardData, departureApi, Departure, colisApi, Colis } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();

  // Initialiser les dates au jour actuel (00:00:00 pour début, 23:59:59 pour fin)
  const getTodayStart = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const getTodayEnd = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
  };

  const [startDate, setStartDate] = useState<Date | null>(getTodayStart());
  const [endDate, setEndDate] = useState<Date | null>(getTodayEnd());
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [recentDepartures, setRecentDepartures] = useState<Departure[]>([]);
  const [recentColis, setRecentColis] = useState<Colis[]>([]);

  // Fonction pour formater la date au format requis: YYYY-MM-DD HH:mm:ss
  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      if (!userId) {
        showToast('error', 'Erreur', 'Utilisateur non identifié');
        return;
      }

      if (!startDate || !endDate) {
        showToast('error', 'Erreur', 'Veuillez sélectionner une date de début et de fin');
        return;
      }

      const response = await dashboardApi.getDashboard({
        debut: formatDateForAPI(startDate),
        fin: formatDateForAPI(endDate),
        user: parseInt(userId),
      });

      setDashboardData(response.data);
      showToast('success', 'Succès', 'Données actualisées avec succès');
    } catch (error: any) {
      showToast('error', 'Erreur', error.message || 'Erreur de chargement du dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Charger les derniers départs
  const loadRecentDepartures = async () => {
    if (!user) return;

    try {
      const response = await departureApi.loadAllDepartures(parseInt(user.id));
      // Prendre les 5 départs les plus récents
      const recent = response.data.slice(0, 5);
      setRecentDepartures(recent);
    } catch (error) {
      console.error('Erreur lors du chargement des départs:', error);
    }
  };

  // Charger les colis récents
  const loadRecentColis = async () => {
    if (!user) return;

    try {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const response = await colisApi.colisByUser(parseInt(user.id), '', dateStr);
      // Prendre les 5 colis les plus récents
      const recent = response.data.slice(0, 5);
      setRecentColis(recent);
    } catch (error) {
      console.error('Erreur lors du chargement des colis:', error);
    }
  };

  // Charger les données au montage du composant
  useEffect(() => {
    loadDashboard();
    loadRecentDepartures();
    loadRecentColis();
  }, [user]);

  // Formatage du chiffre d'affaire avec séparateur de milliers
  const formatCurrency = (value: number): string => {
    return value.toLocaleString('fr-FR');
  };

  const stats = [
    {
      label: 'Colis créés',
      value: dashboardData ? dashboardData.cptcolis.toString() : '0',
      subtitle: dashboardData ? `${formatCurrency(dashboardData.colcais ?? 0)} FCFA` : '0 FCFA',
      icon: <Package size={24} />,
      color: 'from-blue-500 to-blue-600'
    },
    {
      label: 'Bagages enregistrés',
      value: dashboardData ? dashboardData.cptbag.toString() : '0',
      subtitle: dashboardData ? `${formatCurrency(dashboardData.bagcais ?? 0)} FCFA` : '0 FCFA',
      icon: <Briefcase size={24} />,
      color: 'from-purple-500 to-purple-600'
    },
    {
      label: 'Tickets vendus',
      value: dashboardData ? dashboardData.nbtick.toString() : '0',
      subtitle: dashboardData ? `${formatCurrency(dashboardData.totaltick)} FCFA` : '0 FCFA',
      icon: <Ticket size={24} />,
      color: 'from-green-500 to-green-600'
    },
    {
      label: 'Chiffre d\'Affaire',
      value: dashboardData ? `${formatCurrency(dashboardData.caisse)} FCFA` : '0 FCFA',
      subtitle: null,
      icon: <DollarSign size={24} />,
      color: 'from-orange-500 to-orange-600'
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Tableau de bord</h1>
        <p className="text-gray-600 dark:text-gray-400">Vue d'ensemble de l'activité de la gare</p>
      </div>

      {/* Filtres */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date de début */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date de début
            </label>
            <div className="relative">
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="dd/MM/yyyy HH:mm"
                placeholderText="Sélectionner la date de début"
                className="input w-full pl-10"
                wrapperClassName="w-full"
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            </div>
          </div>

          {/* Date de fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date de fin
            </label>
            <div className="relative">
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="dd/MM/yyyy HH:mm"
                placeholderText="Sélectionner la date de fin"
                className="input w-full pl-10"
                wrapperClassName="w-full"
                minDate={startDate || undefined}
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            </div>
          </div>

          {/* Bouton Actualiser */}
          <div className="flex items-end">
            <button
              onClick={loadDashboard}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Actualisation...' : 'Actualiser'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="card hover:shadow-soft-lg transition-shadow duration-200">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white`}>
                {stat.icon}
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                {stat.subtitle && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{stat.subtitle}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Derniers départs ({recentDepartures.length})
          </h2>
          <div className="space-y-3">
            {recentDepartures.length > 0 ? (
              recentDepartures.map((depart) => (
                <div key={depart.dep_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Bus size={18} className="text-primary-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{depart.agdest}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Car {depart.dep_numcar}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">{depart.dep_heure}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{depart.dateDep}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Aucun départ récent</p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Activité des colis ({recentColis.length})
          </h2>
          <div className="space-y-3">
            {recentColis.length > 0 ? (
              recentColis.map((colis) => {
                // Déterminer le statut en fonction de exp_stat
                let statusLabel = 'En attente';
                let statusColor = 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';

                if (colis.exp_stat === 1) {
                  statusLabel = 'En attente';
                  statusColor = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
                } else if (colis.exp_stat === 2) {
                  statusLabel = 'En transit';
                  statusColor = 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
                } else if (colis.exp_stat === 3) {
                  statusLabel = 'Livré';
                  statusColor = 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
                }

                return (
                  <div key={colis.exp_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Package size={18} className="text-primary-500" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{colis.exp_code}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{colis.exp_coldesc}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Aucun colis récent</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
