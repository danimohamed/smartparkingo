// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appName => 'Smart Parking';

  @override
  String get commonSave => 'Save';

  @override
  String get commonCancel => 'Cancel';

  @override
  String get commonDelete => 'Delete';

  @override
  String get commonEdit => 'Edit';

  @override
  String get commonSearch => 'Search';

  @override
  String get commonLoading => 'Loading…';

  @override
  String get commonSubmit => 'Submit';

  @override
  String get commonBack => 'Back';

  @override
  String get commonClose => 'Close';

  @override
  String get commonYes => 'Yes';

  @override
  String get commonNo => 'No';

  @override
  String get commonRetry => 'Retry';

  @override
  String get currencyMad => 'MAD';

  @override
  String get errorUnexpected => 'An unexpected error occurred';

  @override
  String get errorNetwork => 'Network error, please try again';

  @override
  String get errorUnauthorized => 'Authentication required';

  @override
  String get errorSessionExpired => 'Session expired. Please sign in again.';

  @override
  String get validationRequired => 'This field is required';

  @override
  String get validationEmail => 'Invalid email address';

  @override
  String validationPasswordMin(int min) {
    return 'Password must contain at least $min characters';
  }

  @override
  String get authLoginTitle => 'Welcome back';

  @override
  String get authLoginSubtitle => 'Sign in to access your dashboard';

  @override
  String get authEmail => 'Email address';

  @override
  String get authPassword => 'Password';

  @override
  String get authForgotPassword => 'Forgot password?';

  @override
  String get authLoginSubmit => 'Sign in';

  @override
  String get authLoginSubmitting => 'Signing in…';

  @override
  String get authNoAccount => 'Don\'t have an account?';

  @override
  String get authCreateAccount => 'Create one';

  @override
  String get authInvalidCredentials => 'Invalid email or password';

  @override
  String get authRegisterTitle => 'Create your account';

  @override
  String get authRegisterSubmit => 'Sign up';

  @override
  String get authFullName => 'Full name';

  @override
  String get authPhone => 'Phone';

  @override
  String get authLogout => 'Sign out';

  @override
  String get navHome => 'Home';

  @override
  String get navParkings => 'Parkings';

  @override
  String get navMyReservations => 'My Reservations';

  @override
  String get navMyPayments => 'My Payments';

  @override
  String get navMyWallet => 'My Wallet';

  @override
  String get navProfile => 'Profile';

  @override
  String get navSettings => 'Settings';

  @override
  String get navLanguage => 'Language';

  @override
  String get parkingTitle => 'Parkings';

  @override
  String parkingPricePerHour(String price) {
    return '$price MAD/h';
  }

  @override
  String parkingAvailableSlots(int count) {
    return '$count slots available';
  }

  @override
  String get reservationCreate => 'Reserve';

  @override
  String get reservationCancel => 'Cancel reservation';

  @override
  String get reservationCreateSuccess => 'Reservation created';

  @override
  String get reservationCancelSuccess => 'Reservation cancelled';

  @override
  String get reservationStartTime => 'Start time';

  @override
  String get reservationEndTime => 'End time';

  @override
  String get reservationTotalPrice => 'Total price';

  @override
  String get walletBalance => 'Balance';

  @override
  String get walletTopUp => 'Top up';

  @override
  String get walletPay => 'Pay';

  @override
  String get walletInsufficientBalance => 'Insufficient balance';

  @override
  String get walletTopUpSuccess => 'Top-up successful';

  @override
  String get walletPaySuccess => 'Payment successful';

  @override
  String get languageFrench => 'Français';

  @override
  String get languageEnglish => 'English';

  @override
  String get settingsLanguageTitle => 'Choose language';
}
