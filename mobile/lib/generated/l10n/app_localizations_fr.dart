// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for French (`fr`).
class AppLocalizationsFr extends AppLocalizations {
  AppLocalizationsFr([String locale = 'fr']) : super(locale);

  @override
  String get appName => 'Smart Parking';

  @override
  String get commonSave => 'Enregistrer';

  @override
  String get commonCancel => 'Annuler';

  @override
  String get commonDelete => 'Supprimer';

  @override
  String get commonEdit => 'Modifier';

  @override
  String get commonSearch => 'Rechercher';

  @override
  String get commonLoading => 'Chargement…';

  @override
  String get commonSubmit => 'Valider';

  @override
  String get commonBack => 'Retour';

  @override
  String get commonClose => 'Fermer';

  @override
  String get commonYes => 'Oui';

  @override
  String get commonNo => 'Non';

  @override
  String get commonRetry => 'Réessayer';

  @override
  String get currencyMad => 'MAD';

  @override
  String get errorUnexpected => 'Une erreur inattendue est survenue';

  @override
  String get errorNetwork => 'Erreur réseau, veuillez réessayer';

  @override
  String get errorUnauthorized => 'Authentification requise';

  @override
  String get errorSessionExpired =>
      'Session expirée. Veuillez vous reconnecter.';

  @override
  String get validationRequired => 'Ce champ est obligatoire';

  @override
  String get validationEmail => 'Adresse email invalide';

  @override
  String validationPasswordMin(int min) {
    return 'Le mot de passe doit contenir au moins $min caractères';
  }

  @override
  String get authLoginTitle => 'Bon retour parmi nous';

  @override
  String get authLoginSubtitle =>
      'Connectez-vous pour accéder à votre tableau de bord';

  @override
  String get authEmail => 'Adresse email';

  @override
  String get authPassword => 'Mot de passe';

  @override
  String get authForgotPassword => 'Mot de passe oublié ?';

  @override
  String get authLoginSubmit => 'Se connecter';

  @override
  String get authLoginSubmitting => 'Connexion…';

  @override
  String get authNoAccount => 'Pas encore de compte ?';

  @override
  String get authCreateAccount => 'Créer un compte';

  @override
  String get authInvalidCredentials => 'Email ou mot de passe invalide';

  @override
  String get authRegisterTitle => 'Créez votre compte';

  @override
  String get authRegisterSubmit => 'S\'inscrire';

  @override
  String get authFullName => 'Nom complet';

  @override
  String get authPhone => 'Téléphone';

  @override
  String get authLogout => 'Se déconnecter';

  @override
  String get navHome => 'Accueil';

  @override
  String get navParkings => 'Parkings';

  @override
  String get navMyReservations => 'Mes réservations';

  @override
  String get navMyPayments => 'Mes paiements';

  @override
  String get navMyWallet => 'Mon portefeuille';

  @override
  String get navProfile => 'Profil';

  @override
  String get navSettings => 'Paramètres';

  @override
  String get navLanguage => 'Langue';

  @override
  String get parkingTitle => 'Parkings';

  @override
  String parkingPricePerHour(String price) {
    return '$price MAD/h';
  }

  @override
  String parkingAvailableSlots(int count) {
    return '$count places disponibles';
  }

  @override
  String get reservationCreate => 'Réserver';

  @override
  String get reservationCancel => 'Annuler la réservation';

  @override
  String get reservationCreateSuccess => 'Réservation créée';

  @override
  String get reservationCancelSuccess => 'Réservation annulée';

  @override
  String get reservationStartTime => 'Heure de début';

  @override
  String get reservationEndTime => 'Heure de fin';

  @override
  String get reservationTotalPrice => 'Prix total';

  @override
  String get walletBalance => 'Solde';

  @override
  String get walletTopUp => 'Recharger';

  @override
  String get walletPay => 'Payer';

  @override
  String get walletInsufficientBalance => 'Solde insuffisant';

  @override
  String get walletTopUpSuccess => 'Recharge effectuée';

  @override
  String get walletPaySuccess => 'Paiement effectué';

  @override
  String get languageFrench => 'Français';

  @override
  String get languageEnglish => 'English';

  @override
  String get settingsLanguageTitle => 'Choisir la langue';
}
