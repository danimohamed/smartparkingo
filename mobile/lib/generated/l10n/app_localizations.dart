import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_fr.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('fr'),
  ];

  /// Application name
  ///
  /// In fr, this message translates to:
  /// **'Smart Parking'**
  String get appName;

  /// No description provided for @commonSave.
  ///
  /// In fr, this message translates to:
  /// **'Enregistrer'**
  String get commonSave;

  /// No description provided for @commonCancel.
  ///
  /// In fr, this message translates to:
  /// **'Annuler'**
  String get commonCancel;

  /// No description provided for @commonDelete.
  ///
  /// In fr, this message translates to:
  /// **'Supprimer'**
  String get commonDelete;

  /// No description provided for @commonEdit.
  ///
  /// In fr, this message translates to:
  /// **'Modifier'**
  String get commonEdit;

  /// No description provided for @commonSearch.
  ///
  /// In fr, this message translates to:
  /// **'Rechercher'**
  String get commonSearch;

  /// No description provided for @commonLoading.
  ///
  /// In fr, this message translates to:
  /// **'Chargement…'**
  String get commonLoading;

  /// No description provided for @commonSubmit.
  ///
  /// In fr, this message translates to:
  /// **'Valider'**
  String get commonSubmit;

  /// No description provided for @commonBack.
  ///
  /// In fr, this message translates to:
  /// **'Retour'**
  String get commonBack;

  /// No description provided for @commonClose.
  ///
  /// In fr, this message translates to:
  /// **'Fermer'**
  String get commonClose;

  /// No description provided for @commonYes.
  ///
  /// In fr, this message translates to:
  /// **'Oui'**
  String get commonYes;

  /// No description provided for @commonNo.
  ///
  /// In fr, this message translates to:
  /// **'Non'**
  String get commonNo;

  /// No description provided for @commonRetry.
  ///
  /// In fr, this message translates to:
  /// **'Réessayer'**
  String get commonRetry;

  /// No description provided for @currencyMad.
  ///
  /// In fr, this message translates to:
  /// **'MAD'**
  String get currencyMad;

  /// No description provided for @errorUnexpected.
  ///
  /// In fr, this message translates to:
  /// **'Une erreur inattendue est survenue'**
  String get errorUnexpected;

  /// No description provided for @errorNetwork.
  ///
  /// In fr, this message translates to:
  /// **'Erreur réseau, veuillez réessayer'**
  String get errorNetwork;

  /// No description provided for @errorUnauthorized.
  ///
  /// In fr, this message translates to:
  /// **'Authentification requise'**
  String get errorUnauthorized;

  /// No description provided for @errorSessionExpired.
  ///
  /// In fr, this message translates to:
  /// **'Session expirée. Veuillez vous reconnecter.'**
  String get errorSessionExpired;

  /// No description provided for @validationRequired.
  ///
  /// In fr, this message translates to:
  /// **'Ce champ est obligatoire'**
  String get validationRequired;

  /// No description provided for @validationEmail.
  ///
  /// In fr, this message translates to:
  /// **'Adresse email invalide'**
  String get validationEmail;

  /// No description provided for @validationPasswordMin.
  ///
  /// In fr, this message translates to:
  /// **'Le mot de passe doit contenir au moins {min} caractères'**
  String validationPasswordMin(int min);

  /// No description provided for @authLoginTitle.
  ///
  /// In fr, this message translates to:
  /// **'Bon retour parmi nous'**
  String get authLoginTitle;

  /// No description provided for @authLoginSubtitle.
  ///
  /// In fr, this message translates to:
  /// **'Connectez-vous pour accéder à votre tableau de bord'**
  String get authLoginSubtitle;

  /// No description provided for @authEmail.
  ///
  /// In fr, this message translates to:
  /// **'Adresse email'**
  String get authEmail;

  /// No description provided for @authPassword.
  ///
  /// In fr, this message translates to:
  /// **'Mot de passe'**
  String get authPassword;

  /// No description provided for @authForgotPassword.
  ///
  /// In fr, this message translates to:
  /// **'Mot de passe oublié ?'**
  String get authForgotPassword;

  /// No description provided for @authLoginSubmit.
  ///
  /// In fr, this message translates to:
  /// **'Se connecter'**
  String get authLoginSubmit;

  /// No description provided for @authLoginSubmitting.
  ///
  /// In fr, this message translates to:
  /// **'Connexion…'**
  String get authLoginSubmitting;

  /// No description provided for @authNoAccount.
  ///
  /// In fr, this message translates to:
  /// **'Pas encore de compte ?'**
  String get authNoAccount;

  /// No description provided for @authCreateAccount.
  ///
  /// In fr, this message translates to:
  /// **'Créer un compte'**
  String get authCreateAccount;

  /// No description provided for @authInvalidCredentials.
  ///
  /// In fr, this message translates to:
  /// **'Email ou mot de passe invalide'**
  String get authInvalidCredentials;

  /// No description provided for @authRegisterTitle.
  ///
  /// In fr, this message translates to:
  /// **'Créez votre compte'**
  String get authRegisterTitle;

  /// No description provided for @authRegisterSubmit.
  ///
  /// In fr, this message translates to:
  /// **'S\'inscrire'**
  String get authRegisterSubmit;

  /// No description provided for @authFullName.
  ///
  /// In fr, this message translates to:
  /// **'Nom complet'**
  String get authFullName;

  /// No description provided for @authPhone.
  ///
  /// In fr, this message translates to:
  /// **'Téléphone'**
  String get authPhone;

  /// No description provided for @authLogout.
  ///
  /// In fr, this message translates to:
  /// **'Se déconnecter'**
  String get authLogout;

  /// No description provided for @navHome.
  ///
  /// In fr, this message translates to:
  /// **'Accueil'**
  String get navHome;

  /// No description provided for @navParkings.
  ///
  /// In fr, this message translates to:
  /// **'Parkings'**
  String get navParkings;

  /// No description provided for @navMyReservations.
  ///
  /// In fr, this message translates to:
  /// **'Mes réservations'**
  String get navMyReservations;

  /// No description provided for @navMyPayments.
  ///
  /// In fr, this message translates to:
  /// **'Mes paiements'**
  String get navMyPayments;

  /// No description provided for @navMyWallet.
  ///
  /// In fr, this message translates to:
  /// **'Mon portefeuille'**
  String get navMyWallet;

  /// No description provided for @navProfile.
  ///
  /// In fr, this message translates to:
  /// **'Profil'**
  String get navProfile;

  /// No description provided for @navSettings.
  ///
  /// In fr, this message translates to:
  /// **'Paramètres'**
  String get navSettings;

  /// No description provided for @navLanguage.
  ///
  /// In fr, this message translates to:
  /// **'Langue'**
  String get navLanguage;

  /// No description provided for @parkingTitle.
  ///
  /// In fr, this message translates to:
  /// **'Parkings'**
  String get parkingTitle;

  /// No description provided for @parkingPricePerHour.
  ///
  /// In fr, this message translates to:
  /// **'{price} MAD/h'**
  String parkingPricePerHour(String price);

  /// No description provided for @parkingAvailableSlots.
  ///
  /// In fr, this message translates to:
  /// **'{count} places disponibles'**
  String parkingAvailableSlots(int count);

  /// No description provided for @reservationCreate.
  ///
  /// In fr, this message translates to:
  /// **'Réserver'**
  String get reservationCreate;

  /// No description provided for @reservationCancel.
  ///
  /// In fr, this message translates to:
  /// **'Annuler la réservation'**
  String get reservationCancel;

  /// No description provided for @reservationCreateSuccess.
  ///
  /// In fr, this message translates to:
  /// **'Réservation créée'**
  String get reservationCreateSuccess;

  /// No description provided for @reservationCancelSuccess.
  ///
  /// In fr, this message translates to:
  /// **'Réservation annulée'**
  String get reservationCancelSuccess;

  /// No description provided for @reservationStartTime.
  ///
  /// In fr, this message translates to:
  /// **'Heure de début'**
  String get reservationStartTime;

  /// No description provided for @reservationEndTime.
  ///
  /// In fr, this message translates to:
  /// **'Heure de fin'**
  String get reservationEndTime;

  /// No description provided for @reservationTotalPrice.
  ///
  /// In fr, this message translates to:
  /// **'Prix total'**
  String get reservationTotalPrice;

  /// No description provided for @walletBalance.
  ///
  /// In fr, this message translates to:
  /// **'Solde'**
  String get walletBalance;

  /// No description provided for @walletTopUp.
  ///
  /// In fr, this message translates to:
  /// **'Recharger'**
  String get walletTopUp;

  /// No description provided for @walletPay.
  ///
  /// In fr, this message translates to:
  /// **'Payer'**
  String get walletPay;

  /// No description provided for @walletInsufficientBalance.
  ///
  /// In fr, this message translates to:
  /// **'Solde insuffisant'**
  String get walletInsufficientBalance;

  /// No description provided for @walletTopUpSuccess.
  ///
  /// In fr, this message translates to:
  /// **'Recharge effectuée'**
  String get walletTopUpSuccess;

  /// No description provided for @walletPaySuccess.
  ///
  /// In fr, this message translates to:
  /// **'Paiement effectué'**
  String get walletPaySuccess;

  /// No description provided for @languageFrench.
  ///
  /// In fr, this message translates to:
  /// **'Français'**
  String get languageFrench;

  /// No description provided for @languageEnglish.
  ///
  /// In fr, this message translates to:
  /// **'English'**
  String get languageEnglish;

  /// No description provided for @settingsLanguageTitle.
  ///
  /// In fr, this message translates to:
  /// **'Choisir la langue'**
  String get settingsLanguageTitle;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'fr'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'fr':
      return AppLocalizationsFr();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
