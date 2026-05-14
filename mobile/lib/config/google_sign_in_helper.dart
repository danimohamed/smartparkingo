import 'dart:io' show Platform;

import 'package:google_sign_in/google_sign_in.dart';

/// Google Sign-In for mobile.
///
/// **Android `ApiException: 10` (DEVELOPER_ERROR)** almost always means:
/// 1. The SHA-1 (debug and/or release) for `app.parkingo.mobile` is not registered in
///    Firebase → Project settings → Your apps → Android, **or**
/// 2. [serverClientId] is a **Web client** from a *different* Google Cloud project than
///    the one in `android/app/google-services.json`.
///
/// This app’s Firebase project is `parkingo-94f9e` (project number `563090848017`).
/// Do **not** hardcode a Web client ID from another project.
///
/// Override Web client (e.g. staging):  
/// `flutter run --dart-define=GOOGLE_SERVER_CLIENT_ID=....apps.googleusercontent.com`  
/// Default matches Web `oauth_client` (`client_type` 3) in `android/app/google-services.json`.
///
/// **iOS:** `flutter run --dart-define=GOOGLE_IOS_CLIENT_ID=...` (iOS OAuth client ID).
///
/// **Security:** Never put OAuth **client_secret** in the Flutter app.
class GoogleSignInHelper {
  GoogleSignInHelper._();
  static final GoogleSignInHelper instance = GoogleSignInHelper._();

  static const String _envServerClientId = String.fromEnvironment(
    'GOOGLE_SERVER_CLIENT_ID',
    defaultValue: '',
  );

  /// Web OAuth client in GCP project `563090848017` (Firebase `parkingo-94f9e`).
  static const String _defaultServerClientId =
      '563090848017-3ti9cp2oqu7vi7v5mmov4q9g3gl80j0r.apps.googleusercontent.com';

  static const String _iosClientId = String.fromEnvironment(
    'GOOGLE_IOS_CLIENT_ID',
    defaultValue: '',
  );

  /// Web application client ID — must stay in sync with `google-services.json`
  /// Web entry (`client_type` 3). Wrong project → `ApiException: 10`.
  static String get _resolvedServerClientId {
    final env = _envServerClientId.trim();
    return env.isNotEmpty ? env : _defaultServerClientId;
  }

  late final GoogleSignIn _gsi = GoogleSignIn(
    scopes: const <String>['email', 'profile'],
    serverClientId: _resolvedServerClientId,
    clientId: Platform.isIOS && _iosClientId.trim().isNotEmpty ? _iosClientId.trim() : null,
  );

  Future<GoogleSignInAccount?> signIn() => _gsi.signIn();

  Future<void> signOut() async {
    try {
      await _gsi.signOut();
    } catch (_) {}
  }
}
