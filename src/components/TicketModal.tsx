import React, { useState, useEffect } from 'react';
import { X, User, CreditCard, Loader2, Printer, MapPin } from 'lucide-react';
import { Departure, Destination } from '../services/api';
import { offlineDestinationApi, offlineTicketApi } from '../services/offline-api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { ThermalPrinter, TicketBuilder } from '../services/printer';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';

interface Seat {
  id: string;
  number: string;
  status: 'available' | 'occupied' | 'selected';
  price: number;
}

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  departure: Departure;
  onSuccess?: () => void;
}

const TicketModal: React.FC<TicketModalProps> = ({ isOpen, onClose, departure, onSuccess }) => {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [isLoadingSeats, setIsLoadingSeats] = useState(true);
  const [printers, setPrinters] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<number | null>(null);
  const [isLoadingDestinations, setIsLoadingDestinations] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<string>('ESPECES');
  const [isSelling, setIsSelling] = useState(false);
  const { error: showError, success: showSuccess } = useToast();
  const { user } = useAuth();

  // Charger les destinations disponibles depuis la BD locale
  useEffect(() => {
    const loadDestinations = async () => {
      const agenceId = localStorage.getItem('agenceId');

      if (!agenceId) {
        console.error('Aucun agenceId trouvé dans le localStorage');
        showError('Erreur', 'Impossible de récupérer l\'agence');
        return;
      }

      try {
        setIsLoadingDestinations(true);
        console.log('📍 [TICKET MODAL] Chargement des destinations depuis la BD locale...');

        // Charger depuis la base de données locale
        const offlineDestinations = await offlineDestinationApi.getByAgence(parseInt(agenceId));
        console.log(`✅ [TICKET MODAL] ${offlineDestinations.length} destination(s) chargée(s)`);

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
      } catch (error) {
        console.error('❌ [TICKET MODAL] Erreur lors du chargement des destinations:', error);
        showError('Erreur', 'Impossible de charger les destinations');
      } finally {
        setIsLoadingDestinations(false);
      }
    };

    if (isOpen) {
      loadDestinations();
    }
  }, [isOpen, showError]);

  // Charger les imprimantes disponibles
  useEffect(() => {
    const loadPrinters = async () => {
      try {
        setIsLoadingPrinters(true);
        console.log('🖨️ Chargement des imprimantes...');
        const printerList = await ThermalPrinter.listPrinters();
        console.log('✅ Imprimantes trouvées:', printerList);
        setPrinters(printerList);

        // Sélectionner la première imprimante par défaut si disponible
        if (printerList.length > 0) {
          setSelectedPrinter(printerList[0]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des imprimantes:', error);
        showError('Erreur', 'Impossible de charger les imprimantes');
      } finally {
        setIsLoadingPrinters(false);
      }
    };

    if (isOpen) {
      loadPrinters();
    }
  }, [isOpen, showError]);

  // Charger les sièges depuis le départ et les tickets vendus
  useEffect(() => {
    const loadSeats = async () => {
      try {
        setIsLoadingSeats(true);
        console.log('💺 [TICKET MODAL] Génération des sièges pour le départ:', departure.dep_id);
        console.log('💺 [TICKET MODAL] Nombre de places:', departure.dep_place);

        // Générer tous les sièges basés sur dep_place
        const totalSeats = departure.dep_place;
        const allSeats: Seat[] = Array.from({ length: totalSeats }, (_, i) => {
          const seatNum = i + 1;
          return {
            id: `S${seatNum}`,
            number: `S${seatNum}`,
            status: 'available',
            price: 0, // Le prix sera déterminé par la destination sélectionnée
          };
        });

        // Charger les tickets vendus depuis la BD locale
        const soldTickets = await offlineTicketApi.getByDeparture(departure.dep_id);
        console.log(`🎫 [TICKET MODAL] ${soldTickets.length} ticket(s) vendu(s) pour ce départ`);

        // Marquer les sièges vendus comme occupés
        const soldSeats = new Set(soldTickets.map(ticket => `S${ticket.tick_siege}`));
        const transformedSeats = allSeats.map(seat => {
          if (soldSeats.has(seat.number)) {
            return { ...seat, status: 'occupied' as const };
          }
          return seat;
        });

        console.log('✅ [TICKET MODAL] Total sièges:', transformedSeats.length);
        console.log('✅ [TICKET MODAL] Sièges occupés:', transformedSeats.filter(s => s.status === 'occupied').length);
        console.log('✅ [TICKET MODAL] Sièges disponibles:', transformedSeats.filter(s => s.status === 'available').length);
        setSeats(transformedSeats);
      } catch (error) {
        console.error('❌ [TICKET MODAL] Erreur lors du chargement des sièges:', error);
        showError('Erreur', 'Impossible de charger les sièges');
      } finally {
        setIsLoadingSeats(false);
      }
    };

    if (isOpen) {
      loadSeats();
    }
  }, [isOpen, departure.dep_id, departure.dep_place, showError]);

  const handleSeatClick = (seatId: string) => {
    const seat = seats.find(s => s.id === seatId);
    if (seat?.status === 'occupied') return;

    setSeats(prevSeats => {
      const existingSeat = prevSeats.find(s => s.id === seatId);

      if (existingSeat) {
        // Toggle: si le siège est sélectionné, on le désélectionne, sinon on le sélectionne
        return prevSeats.map(s =>
          s.id === seatId
            ? { ...s, status: s.status === 'selected' ? ('available' as const) : ('selected' as const) }
            : s
        );
      } else {
        // Le siège n'existe pas, on le crée avec le statut 'selected'
        return [
          ...prevSeats,
          {
            id: seatId,
            number: seatId,
            status: 'selected' as const,
            price: prevSeats[0]?.price || 0,
          }
        ];
      }
    });

    // Toggle dans selectedSeats
    setSelectedSeats(prev => {
      if (prev.includes(seatId)) {
        // Désélectionner
        return prev.filter(id => id !== seatId);
      } else {
        // Sélectionner
        return [...prev, seatId];
      }
    });
  };

  // Calculer le prix basé sur la destination sélectionnée
  const getDestinationPrice = (): number => {
    if (!selectedDestination) return 0;
    const destination = destinations.find(d => d.dest_id === selectedDestination);
    return destination ? parseFloat(destination.dest_price) : 0;
  };

  // Le prix total = prix de la destination × nombre de sièges sélectionnés
  const totalPrice = selectedSeats.length > 0 ? getDestinationPrice() * selectedSeats.length : 0;

  // Gérer le changement de destination
  const handleDestinationChange = (destId: string) => {
    const id = parseInt(destId);
    setSelectedDestination(id || null);
  };

  // Fonction pour recharger les sièges depuis la BD locale
  const reloadSeats = async () => {
    try {
      setIsLoadingSeats(true);
      console.log('💺 [TICKET MODAL] Rechargement des sièges...');

      // Charger les tickets vendus depuis la BD locale
      const soldTickets = await offlineTicketApi.getByDeparture(departure.dep_id);
      console.log(`🎫 [TICKET MODAL] ${soldTickets.length} ticket(s) vendu(s) pour ce départ`);

      // Marquer les sièges vendus comme occupés
      const soldSeats = new Set(soldTickets.map(ticket => `S${ticket.tick_siege}`));
      const updatedSeats = seats.map(seat => {
        if (soldSeats.has(seat.number)) {
          return { ...seat, status: 'occupied' as const };
        }
        // Réinitialiser les sièges sélectionnés comme disponibles
        if (seat.status === 'selected') {
          return { ...seat, status: 'available' as const };
        }
        return seat;
      });

      console.log('✅ [TICKET MODAL] Sièges rechargés');
      setSeats(updatedSeats);
    } catch (error) {
      console.error('❌ [TICKET MODAL] Erreur lors du rechargement des sièges:', error);
      showError('Erreur', 'Impossible de recharger les sièges');
    } finally {
      setIsLoadingSeats(false);
    }
  };

  // Fonction pour vendre un ticket payant
  const handleSellTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDestination || selectedSeats.length === 0) {
      showError('Erreur', 'Veuillez sélectionner une destination et au moins un siège');
      return;
    }

    if (!selectedPrinter) {
      showError('Erreur', 'Veuillez sélectionner une imprimante');
      return;
    }

    // Validation du téléphone si renseigné (au moins 8 chiffres)
    if (customerInfo.phone.trim()) {
      const phoneDigits = customerInfo.phone.replace(/\D/g, '');
      if (phoneDigits.length < 8) {
        showError('Erreur', 'Veuillez entrer un numéro de téléphone valide (minimum 8 chiffres)');
        return;
      }
    }

    try {
      setIsSelling(true);
      const userId = localStorage.getItem('userId');

      if (!userId) {
        showError('Erreur', 'Session expirée, veuillez vous reconnecter');
        return;
      }

      console.log(`💾 [TICKET MODAL] Vente de ${selectedSeats.length} ticket(s) en local...`);

      // Prix unitaire pour chaque siège
      const unitPrice = getDestinationPrice();
      const selectedDest = destinations.find(d => d.dest_id === selectedDestination);

      // Vendre un ticket pour chaque siège sélectionné
      const soldTickets = [];
      const errors = [];

      for (const seatId of selectedSeats) {
        try {
          // Extraire le numéro du siège (enlever le "S")
          const seatNumber = parseInt(seatId.replace('S', ''));

          console.log(`💾 [TICKET MODAL] Vente du ticket pour le siège ${seatId}...`);
          const ticket = await offlineTicketApi.sell({
            user: parseInt(userId),
            depart: departure.dep_id,
            dest: selectedDestination,
            siege: seatNumber,
            phone: customerInfo.phone,
            voyageur: customerInfo.name,
            price: unitPrice,
            method: paymentMethod,
            reduction: 0,
            nature: 'PAYANT',
          });

          console.log(`✅ [TICKET MODAL] Ticket vendu pour le siège ${seatId}:`, ticket);
          soldTickets.push({ ticket, seatId, seatNumber });
        } catch (error: any) {
          console.error(`❌ [TICKET MODAL] Erreur pour le siège ${seatId}:`, error);
          errors.push({ seatId, error: error.message });
        }
      }

      // Afficher le résultat
      if (soldTickets.length > 0) {
        showSuccess('Succès', `${soldTickets.length} ticket(s) vendu(s) avec succès (sera synchronisé automatiquement)`);

        // Imprimer tous les tickets vendus
        if (selectedPrinter) {
          console.log(`🖨️ [TICKET MODAL] Impression de ${soldTickets.length} ticket(s)...`);
          for (const { ticket, seatId, seatNumber } of soldTickets) {
            try {
              const ticketData = {
                tick_id: ticket.id,
                tick_siege: seatNumber.toString(),
                tick_nature: 'PAYANT',
                dep_nom: departure.dep_nom,
                dep_date: departure.dep_date,
                dep_heure: departure.dep_heure,
                dep_numcar: departure.dep_numcar,
                ag_nom: departure.ag_nom,
                dest_ville: selectedDest?.dest_ville || 'N/A',
                dest_price: unitPrice.toString(),
              };

              await printTicket(ticketData, user?.companyLogo);
              console.log(`✅ [TICKET MODAL] Ticket imprimé pour le siège ${seatId}`);
            } catch (error) {
              console.error(`❌ [TICKET MODAL] Erreur d'impression pour le siège ${seatId}:`, error);
            }
          }
        }
      }

      // Afficher les erreurs s'il y en a
      if (errors.length > 0) {
        const errorMsg = `Erreur pour ${errors.length} siège(s): ${errors.map(e => e.seatId).join(', ')}`;
        showError('Erreur partielle', errorMsg);
      }

      // Réinitialiser le formulaire
      setSelectedSeats([]);
      setCustomerInfo({ name: '', phone: '' });
      setSelectedDestination(null);

      // Recharger les sièges pour afficher la mise à jour
      await reloadSeats();

      // Notifier la page parente pour actualiser les données
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Erreur lors de la vente des tickets:', error);
      showError('Erreur', error.message || 'Impossible de vendre les tickets');
    } finally {
      setIsSelling(false);
    }
  };

  // Fonction pour créer un ticket gratuit
  const handleFreeTicket = async () => {
    if (!selectedDestination || selectedSeats.length === 0) {
      showError('Erreur', 'Veuillez sélectionner une destination et au moins un siège');
      return;
    }

    if (!selectedPrinter) {
      showError('Erreur', 'Veuillez sélectionner une imprimante');
      return;
    }

    // Validation du téléphone si renseigné (au moins 8 chiffres)
    if (customerInfo.phone.trim()) {
      const phoneDigits = customerInfo.phone.replace(/\D/g, '');
      if (phoneDigits.length < 8) {
        showError('Erreur', 'Veuillez entrer un numéro de téléphone valide (minimum 8 chiffres)');
        return;
      }
    }

    try {
      setIsSelling(true);
      const userId = localStorage.getItem('userId');

      if (!userId) {
        showError('Erreur', 'Session expirée, veuillez vous reconnecter');
        return;
      }

      console.log(`💾 [TICKET MODAL] Création de ${selectedSeats.length} ticket(s) gratuit(s) en local...`);

      // Prix unitaire pour chaque siège
      const unitPrice = getDestinationPrice();
      const selectedDest = destinations.find(d => d.dest_id === selectedDestination);

      // Créer un ticket gratuit pour chaque siège sélectionné
      const soldTickets = [];
      const errors = [];

      for (const seatId of selectedSeats) {
        try {
          // Extraire le numéro du siège (enlever le "S")
          const seatNumber = parseInt(seatId.replace('S', ''));

          console.log(`💾 [TICKET MODAL] Création du ticket gratuit pour le siège ${seatId}...`);
          const ticket = await offlineTicketApi.sell({
            user: parseInt(userId),
            depart: departure.dep_id,
            dest: selectedDestination,
            siege: seatNumber,
            phone: customerInfo.phone,
            voyageur: customerInfo.name,
            price: unitPrice,
            method: paymentMethod,
            reduction: unitPrice, // Réduction égale au prix pour les tickets gratuits
            nature: 'GRATUIT',
          });

          console.log(`✅ [TICKET MODAL] Ticket gratuit créé pour le siège ${seatId}:`, ticket);
          soldTickets.push({ ticket, seatId, seatNumber });
        } catch (error: any) {
          console.error(`❌ [TICKET MODAL] Erreur pour le siège ${seatId}:`, error);
          errors.push({ seatId, error: error.message });
        }
      }

      // Afficher le résultat
      if (soldTickets.length > 0) {
        showSuccess('Succès', `${soldTickets.length} ticket(s) gratuit(s) créé(s) avec succès (sera synchronisé automatiquement)`);

        // Imprimer tous les tickets vendus
        if (selectedPrinter) {
          console.log(`🖨️ [TICKET MODAL] Impression de ${soldTickets.length} ticket(s) gratuit(s)...`);
          for (const { ticket, seatId, seatNumber } of soldTickets) {
            try {
              const ticketData = {
                tick_id: ticket.id,
                tick_siege: seatNumber.toString(),
                tick_nature: 'GRATUIT',
                dep_nom: departure.dep_nom,
                dep_date: departure.dep_date,
                dep_heure: departure.dep_heure,
                dep_numcar: departure.dep_numcar,
                ag_nom: departure.ag_nom,
                dest_ville: selectedDest?.dest_ville || 'N/A',
                dest_price: unitPrice.toString(),
              };

              await printTicket(ticketData, user?.companyLogo);
              console.log(`✅ [TICKET MODAL] Ticket gratuit imprimé pour le siège ${seatId}`);
            } catch (error) {
              console.error(`❌ [TICKET MODAL] Erreur d'impression pour le siège ${seatId}:`, error);
            }
          }
        }
      }

      // Afficher les erreurs s'il y en a
      if (errors.length > 0) {
        const errorMsg = `Erreur pour ${errors.length} siège(s): ${errors.map(e => e.seatId).join(', ')}`;
        showError('Erreur partielle', errorMsg);
      }

      // Réinitialiser le formulaire
      setSelectedSeats([]);
      setCustomerInfo({ name: '', phone: '' });
      setSelectedDestination(null);

      // Recharger les sièges pour afficher la mise à jour
      await reloadSeats();

      // Notifier la page parente pour actualiser les données
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Erreur lors de la création des tickets gratuits:', error);
      showError('Erreur', error.message || 'Impossible de créer les tickets gratuits');
    } finally {
      setIsSelling(false);
    }
  };

  // Fonction pour formater les nombres avec des espaces simples (compatible imprimante thermique)
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Fonction pour imprimer le ticket
  const printTicket = async (ticketData: any, logoUrl?: string) => {
    try {
      console.log('🖨️ === DÉBUT IMPRESSION ===');
      console.log('📦 ticketData reçu:', ticketData);
      console.log('🖼️ Logo URL reçu:', logoUrl || 'Absent/undefined');

      console.log('📋 Construction du ticket avec ticketData:', ticketData);

      // Extraire les données du ticket
      const ticketNumber = ticketData.tick_id?.toString() || 'N/A';
      const departure = ticketData.dep_nom || 'N/A';
      const date = ticketData.dep_date || 'N/A';
      const time = ticketData.dep_heure || 'N/A';
      const busNumber = ticketData.dep_numcar || undefined;
      const departureStation = ticketData.ag_nom || 'N/A';
      const destination = ticketData.dest_ville || 'N/A';
      const seatNumber = ticketData.tick_siege || selectedSeats[0];

      // Si c'est un ticket gratuit, afficher "Billet gratuit" au lieu du prix
      const isGratuit = ticketData.tick_nature === 'GRATUIT';
      const price = isGratuit
        ? 'Billet gratuit'
        : (ticketData.dest_price ? `${formatNumber(parseInt(ticketData.dest_price))} FCFA` : 'N/A');

      console.log('📋 Données extraites:', {
        ticketNumber,
        departure,
        date,
        time,
        busNumber,
        departureStation,
        destination,
        seatNumber,
        price,
        isGratuit
      });

      // Créer les données du ticket avec le nom de l'entreprise
      const ticket = TicketBuilder.createTransportTicket({
        ticketNumber,
        departure,
        date,
        time,
        busNumber,
        departureStation,
        destination,
        seatNumber,
        price,
        passenger: customerInfo.name || undefined,
        phone: customerInfo.phone || undefined,
        isGratuit, // Passer l'information pour adapter le total
        companyName: user?.companyName,
      });

      // Préparer le logo
      let cleanLogo: string | undefined = undefined;

      if (logoUrl) {
        try {
          console.log('🔗 URL/DATA du logo:', logoUrl);

          // Vérifier si c'est une URL (commence par http:// ou https://)
          if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
            console.log('🌐 Logo est une URL HTTP/HTTPS');
            console.log('🌐 URL complète:', logoUrl);
            console.log('🔄 Téléchargement en cours...');

            cleanLogo = await ThermalPrinter.urlToBase64(logoUrl);

            console.log('✅ Logo téléchargé et converti en base64');
            console.log('✅ Taille du base64:', cleanLogo.length, 'caractères');
            console.log('✅ Premiers 100 chars:', cleanLogo.substring(0, 100));
          }
          // Vérifier si c'est un chemin de fichier local (commence par / ou C:\ ou contient /)
          else if (logoUrl.startsWith('/') || logoUrl.match(/^[A-Z]:\\/i) || logoUrl.includes('/')) {
            console.log('📁 Logo est un chemin de fichier local');
            console.log('📁 Chemin:', logoUrl);
            console.log('🔄 Lecture du fichier local en cours...');

            // Utiliser la commande Tauri pour lire le fichier directement en base64
            const { invoke } = await import('@tauri-apps/api/core');
            cleanLogo = await invoke<string>('read_file_as_base64', { filePath: logoUrl });

            console.log('✅ Fichier local lu et converti en base64');
            console.log('✅ Taille du base64:', cleanLogo.length, 'caractères');
            console.log('✅ Premiers 100 chars:', cleanLogo.substring(0, 100));
          }
          // Vérifier si c'est déjà du base64 avec préfixe data:image
          else if (logoUrl.includes(',')) {
            console.log('🔍 Logo contient un préfixe data:image, extraction...');
            cleanLogo = logoUrl.split(',')[1];
            console.log('✂️ Logo nettoyé (enlevé préfixe data:image)');
            console.log('✅ Taille du base64:', cleanLogo.length, 'caractères');
          }
          // Sinon, considérer que c'est déjà du base64 pur
          else {
            console.log('📝 Logo semble être du base64 pur');
            console.log('📝 Contenu reçu:', logoUrl.substring(0, 200));
            cleanLogo = logoUrl;
          }

          console.log('🖼️ Logo final (premiers 100 chars):', cleanLogo.substring(0, 100));
        } catch (error) {
          console.error('❌ Erreur lors du traitement du logo:', error);
          showError('Attention', 'Impossible de charger le logo, impression sans logo');
        }
      } else {
        console.log('⚠️ AUCUN LOGO FOURNI (logoUrl est null/undefined)');
      }

      console.log('🖨️ Impression souche et ticket...', {
        hasLogo: !!cleanLogo,
        logoLength: cleanLogo?.length || 0,
        ticketNumber,
        printerName: selectedPrinter
      });

      // Imprimer souche et ticket en une seule fois (pas de latence!)
      await ThermalPrinter.printStubAndTicket(
        selectedPrinter,
        ticket,
        cleanLogo
      );

      console.log('✅ Impression terminée avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'impression:', error);
      showError('Attention', 'Le ticket a été créé mais l\'impression a échoué');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Vente de Ticket</h2>
            <p className="text-primary-100">
              {departure.agdest} - Départ: {departure.dep_heure} - {departure.dep_numcar}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Plan des places */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Sélectionnez la place
              </h3>

              {/* Légende */}
              <div className="flex gap-4 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-500 rounded"></div>
                  <span className="text-gray-700 dark:text-gray-300">Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 rounded"></div>
                  <span className="text-gray-700 dark:text-gray-300">Sélectionné</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-500 rounded"></div>
                  <span className="text-gray-700 dark:text-gray-300">Occupé</span>
                </div>
              </div>

              {/* Schéma du car */}
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
                {isLoadingSeats ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-primary-500" size={40} />
                  </div>
                ) : (
                  <>
                    {/* Sièges - 3 colonnes à gauche, 2 colonnes à droite */}
                    <div className="space-y-3">
                      {Array.from({ length: Math.ceil(seats.length / 5) }, (_, i) => i + 1).map(row => {
                        // Calculer les numéros de sièges pour cette rangée
                        const leftSeats = [1, 2, 3].map(col => (row - 1) * 5 + col);
                        const rightSeats = [4, 5].map(col => (row - 1) * 5 + col);

                        return (
                          <div key={row} className="flex gap-3 justify-center">
                            {/* Côté gauche (3 colonnes) */}
                            {leftSeats.map(seatNum => {
                              if (seatNum > seats.length) return null; // Ne pas afficher au-delà du nombre de sièges
                              const seatNumber = `S${seatNum}`;
                              const seat = seats.find(s => s.number === seatNumber);
                              const seatStatus = seat?.status || 'available';

                              return (
                                <button
                                  key={seatNumber}
                                  onClick={() => handleSeatClick(seatNumber)}
                                  disabled={seatStatus === 'occupied'}
                                  className={`w-12 h-12 rounded-lg font-medium text-sm transition-all ${
                                    seatStatus === 'available'
                                      ? 'bg-green-500 hover:bg-green-600 text-white cursor-pointer'
                                      : seatStatus === 'selected'
                                      ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                                      : 'bg-red-500 dark:bg-red-600 text-white cursor-not-allowed'
                                  }`}
                                >
                                  {seatNum}
                                </button>
                              );
                            })}

                            {/* Allée */}
                            <div className="w-8"></div>

                            {/* Côté droit (2 colonnes) */}
                            {rightSeats.map(seatNum => {
                              if (seatNum > seats.length) return null; // Ne pas afficher au-delà du nombre de sièges
                              const seatNumber = `S${seatNum}`;
                              const seat = seats.find(s => s.number === seatNumber);
                              const seatStatus = seat?.status || 'available';

                              return (
                                <button
                                  key={seatNumber}
                                  onClick={() => handleSeatClick(seatNumber)}
                                  disabled={seatStatus === 'occupied'}
                                  className={`w-12 h-12 rounded-lg font-medium text-sm transition-all ${
                                    seatStatus === 'available'
                                      ? 'bg-green-500 hover:bg-green-600 text-white cursor-pointer'
                                      : seatStatus === 'selected'
                                      ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                                      : 'bg-red-500 dark:bg-red-600 text-white cursor-not-allowed'
                                  }`}
                                >
                                  {seatNum}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Formulaire client */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Informations du client
              </h3>

              <form onSubmit={handleSellTicket} className="space-y-4">
                {/* Sélection de l'imprimante */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Imprimante
                  </label>
                  <div className="relative">
                    <Printer className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <select
                      value={selectedPrinter}
                      onChange={(e) => setSelectedPrinter(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white appearance-none"
                      disabled={isLoadingPrinters}
                      required
                    >
                      {isLoadingPrinters ? (
                        <option value="">Chargement des imprimantes...</option>
                      ) : printers.length === 0 ? (
                        <option value="">Aucune imprimante trouvée</option>
                      ) : (
                        <>
                          <option value="">Sélectionner une imprimante</option>
                          {printers.map((printer, index) => (
                            <option key={index} value={printer}>
                              {printer}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                  {isLoadingPrinters && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Recherche des imprimantes...
                    </p>
                  )}
                </div>

                {/* Sélection de la destination */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Destination
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <select
                      value={selectedDestination || ''}
                      onChange={(e) => handleDestinationChange(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white appearance-none"
                      disabled={isLoadingDestinations}
                      required
                    >
                      {isLoadingDestinations ? (
                        <option value="">Chargement des destinations...</option>
                      ) : destinations.length === 0 ? (
                        <option value="">Aucune destination trouvée</option>
                      ) : (
                        <>
                          <option value="">Sélectionner une destination</option>
                          {destinations.map((dest) => (
                            <option key={dest.dest_id} value={dest.dest_id}>
                              {dest.dest_ville} - {parseFloat(dest.dest_price).toLocaleString()} FCFA
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                  {selectedDestination && (
                    <p className="text-sm text-primary-600 dark:text-primary-400 mt-1 font-medium">
                      Prix unitaire: {getDestinationPrice().toLocaleString()} FCFA
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nom complet
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      placeholder="Kouassi Jean"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Téléphone voyageur
                  </label>
                  <PhoneInput
                    defaultCountry="ci"
                    value={customerInfo.phone}
                    onChange={(phone) => setCustomerInfo({ ...customerInfo, phone })}
                    inputClassName="w-full"
                    className="phone-input-custom"
                  />
                </div>

                {/* Résumé */}
                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">
                      {selectedSeats.length > 1 ? 'Sièges sélectionnés:' : 'Siège sélectionné:'}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'Aucun'}
                    </span>
                  </div>
                  {selectedSeats.length > 1 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">Prix unitaire:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {getDestinationPrice().toLocaleString()} FCFA
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-primary-200 dark:border-primary-700">
                    <span className="text-gray-900 dark:text-white">
                      {selectedSeats.length > 1 ? `Total (${selectedSeats.length} sièges):` : 'Prix:'}
                    </span>
                    <span className="text-primary-600 dark:text-primary-400">
                      {totalPrice.toLocaleString()} FCFA
                    </span>
                  </div>
                </div>

                {/* Méthode de paiement */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Méthode de paiement
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="ESPECES">Espèces</option>
                    <option value="ORANGE">Orange Money</option>
                    <option value="MTN">MTN Money</option>
                    <option value="MOOV">Moov Money</option>
                    <option value="WAVE">Wave</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleFreeTicket}
                    disabled={isSelling || selectedSeats.length === 0}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSelling ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      selectedSeats.length > 1 ? 'Tickets gratuits' : 'Ticket gratuit'
                    )}
                  </button>
                  <button
                    type="submit"
                    disabled={isSelling || selectedSeats.length === 0}
                    className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSelling ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      <>
                        <CreditCard size={20} />
                        {selectedSeats.length > 1 ? 'Vendre les tickets' : 'Vendre le ticket'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketModal;
