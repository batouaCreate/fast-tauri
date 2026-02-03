import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Phone, Lock, Eye, EyeOff, Loader2, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { invoke } from '@tauri-apps/api/core';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { error: showError, success: showSuccess } = useToast();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(phone, password);
      showSuccess('Connexion réussie', 'Bienvenue sur Fast!');
      navigate('/');
    } catch (error) {
      console.error('Erreur de connexion:', error);
      const errorMessage = error instanceof Error ? error.message : 'Identifiants invalides';
      showError('Erreur de connexion', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncData = async () => {
    setIsSyncing(true);
    try {
      const result = await invoke<string>('sync_users_data');
      showSuccess('Synchronisation réussie', result);
    } catch (error) {
      console.error('Erreur de synchronisation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la synchronisation';
      showError('Erreur de synchronisation', errorMessage);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-soft-lg mb-4">
            <Car className="text-primary-500" size={40} />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Fast</h1>
          <p className="text-primary-100">Transport & Logistique</p>
        </div>

        {/* Formulaire de connexion */}
        <div className="bg-white rounded-2xl shadow-soft-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Connexion</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de téléphone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0700000001"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
                <span className="ml-2 text-sm text-gray-600">Se souvenir de moi</span>
              </label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-primary-500 hover:text-primary-600 font-medium"
              >
                Mot de passe oublié?
              </button>
            </div>

            <button
              type="submit"
              className="w-full btn-primary flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="animate-spin" size={20} />}
              {isLoading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>

          {/* Bouton de synchronisation des données */}
          <div className="mt-4">
            <button
              type="button"
              onClick={handleSyncData}
              disabled={isSyncing}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-soft"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Téléchargement en cours...</span>
                </>
              ) : (
                <>
                  <Download size={20} />
                  <span>Télécharger les données</span>
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Synchroniser les entreprises, agences et utilisateurs
            </p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Pas encore de compte?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-primary-500 hover:text-primary-600 font-medium"
              >
                S'inscrire
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-primary-100 text-sm mt-6">
          © 2025 Fast. Tous droits réservés.
        </p>
      </div>
    </div>
  );
};

export default Login;
