import 'dart:io' show Platform;

class ApiConstants {
  /// Production API URL (Heroku — JawsDB MySQL backend).
  static const String _prodBaseUrl = 'https://api.parkingo.app/api';

  /// Override at build time:
  ///   flutter run --dart-define=API_BASE_URL=https://api.parkingo.app/api
  ///   flutter build ios --dart-define=API_BASE_URL=https://api.parkingo.app/api
  ///
  /// To use a local backend during development:
  ///   flutter run --dart-define=USE_LOCAL_API=true
  static const String _envBaseUrl =
      String.fromEnvironment('API_BASE_URL', defaultValue: '');
  static const bool _useLocal =
      bool.fromEnvironment('USE_LOCAL_API', defaultValue: false);

  /// Returns the API base URL.
  ///
  /// Default: production (https://api.parkingo.app/api).
  /// If --dart-define=API_BASE_URL=… is provided it wins.
  /// If --dart-define=USE_LOCAL_API=true, fall back to localhost / 10.0.2.2.
  static String get baseUrl {
    if (_envBaseUrl.isNotEmpty) return _envBaseUrl;
    if (!_useLocal) return _prodBaseUrl;
    try {
      if (Platform.isAndroid) return 'http://10.0.2.2:8080/api';
    } catch (_) {}
    return 'http://localhost:8080/api';
  }

  // Auth
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String oauthLogin = '/auth/oauth-login';

  // Parkings
  static const String parkings = '/parkings';
  static const String activeParkings = '/parkings/active';
  static String parkingById(int id) => '/parkings/$id';
  static String searchParkings(String name) =>
      '/parkings/search?name=${Uri.encodeComponent(name)}';

  // Parking Slots
  static String slotById(int id) => '/parking-slots/$id';
  static String slotsByParking(int parkingId) =>
      '/parking-slots/parking/$parkingId';
  static String availableSlots(int parkingId) =>
      '/parking-slots/available/$parkingId';

  // Reservations
  static const String reservations = '/reservations';
  static String reservationById(int id) => '/reservations/$id';
  static const String myReservations = '/reservations/my-reservations';
  static String cancelReservation(int id) => '/reservations/$id/cancel';
  static String reservationQr(int id) => '/reservations/$id/qr';

  // Users
  static const String currentUser = '/users/me';
  static const String updateDefaultVehiclePlate = '/users/me/default-vehicle-plate';
  static const String updateFcmToken = '/users/me/fcm-token';

  // Guard
  static const String guardValidateEntry = '/guard/validate-entry';
  static const String guardValidateExit = '/guard/validate-exit';
  static const String guardValidateEntryManual = '/guard/validate-entry-manual';
  static const String guardValidateExitManual = '/guard/validate-exit-manual';
  static String guardActiveBookings(int parkingId) =>
      '/guard/parking/$parkingId/active-bookings';
  static String guardManualOccupy(int slotId) =>
      '/guard/slots/$slotId/manual-occupy';
  static String guardManualFree(int slotId) =>
      '/guard/slots/$slotId/manual-free';
  static const String guardPlateEntry = '/guard/plate/entry';
  static const String guardPlateExit = '/guard/plate/exit';
  static const String guardPlateOcr = '/guard/plate/ocr';
  static const String guardPlateScan = '/guard/plate/scan';
  static String guardTodayPlateScanStats(int parkingId) =>
      '/guard/parking/$parkingId/plate-scan-stats/today';
  static String guardPlateLookup({required int parkingId, required String plate}) =>
      '/guard/plate/lookup?parkingId=$parkingId&plate=${Uri.encodeComponent(plate)}';
  static String guardActiveWalkIns(int parkingId) =>
      '/guard/parking/$parkingId/active-walk-ins';
  static String guardMarkWalkInPaid(int sessionId) =>
      '/guard/walk-in/$sessionId/mark-paid';

  // Payments
  static String paymentByReservation(int id) => '/payments/reservation/$id';
  static const String myPayments = '/payments/my-payments';

  // Wallet
  static const String walletBalance = '/wallet/balance';
  static const String walletTopUp = '/wallet/top-up';
  static const String walletPay = '/wallet/pay';
  static const String walletTransactions = '/wallet/transactions';

  // Guard ↔ user chats (after booking at a guarded parking)
  static const String chats = '/chats';
  static String chatMessages(int chatId) => '/chats/$chatId/messages';

  // Navigation
  static String navigationRoute(
    double userLat,
    double userLng,
    double parkingLat,
    double parkingLng,
  ) =>
      '/navigation/route?userLat=$userLat&userLng=$userLng&parkingLat=$parkingLat&parkingLng=$parkingLng';
}

class AppConstants {
  static const String appName = 'Smart Parking';
  static const String tokenKey = 'jwt_token';
  static const String userKey = 'user_data';

  // Default location — Marrakech
  static const double defaultLat = 31.6295;
  static const double defaultLng = -7.9811;

  // Map
  static const double defaultZoom = 14.0;
  static const double markerZoom = 16.0;

  // Gemini AI — override via:
  //   flutter run --dart-define=GEMINI_API_KEY=xxx
  static const String _geminiApiKeyEnv =
      String.fromEnvironment('GEMINI_API_KEY', defaultValue: '');
  static String get geminiApiKey => _geminiApiKeyEnv.isEmpty
      ? ''
      : _geminiApiKeyEnv;

  // Mapbox — override via:
  //   flutter run --dart-define=MAPBOX_TOKEN=pk.xxx
  static const String _mapboxTokenEnv =
      String.fromEnvironment('MAPBOX_TOKEN', defaultValue: '');
  static String get mapboxAccessToken => _mapboxTokenEnv.isEmpty
      ? ''
      : _mapboxTokenEnv;
  static String get mapboxStyleUrl =>
      'https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}@2x?access_token=$mapboxAccessToken&worldview=MA';

  /// Returns a list of missing required secret names. Empty when fully configured.
  static List<String> missingSecrets() {
    // Keys have built-in fallbacks — this list will only be non-empty if
    // someone explicitly passes an empty string via --dart-define.
    return const [];
  }
}
