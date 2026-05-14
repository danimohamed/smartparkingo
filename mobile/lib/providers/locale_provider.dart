import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../services/dio_client.dart';

/// Manages the app locale.
///
/// - Default and fallback: French ('fr').
/// - Persisted in [FlutterSecureStorage] under the `app_locale` key so the
///   choice survives restarts.
/// - Detects device locale on first launch and adopts it only if supported,
///   otherwise sticks with French.
class LocaleProvider extends ChangeNotifier {
  static const String _storageKey = 'app_locale';
  static const Locale defaultLocale = Locale('fr');

  static const List<Locale> supportedLocales = <Locale>[
    Locale('fr'),
    Locale('en'),
    // Locale('ar'), // Enable when app_ar.arb + RTL audit are done.
  ];

  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  Locale _locale = defaultLocale;
  bool _initialized = false;

  Locale get locale => _locale;
  bool get isInitialized => _initialized;

  /// Returns the active language code (`fr`, `en`, …) — useful for the Dio
  /// `Accept-Language` interceptor.
  String get languageCode => _locale.languageCode;

  Future<void> load() async {
    try {
      final stored = await _storage.read(key: _storageKey);
      if (stored != null && _isSupported(stored)) {
        _locale = Locale(stored);
      } else {
        // First launch — use device locale if supported, otherwise French.
        final device = WidgetsBinding.instance.platformDispatcher.locale;
        if (_isSupported(device.languageCode)) {
          _locale = Locale(device.languageCode);
        }
      }
    } catch (_) {
      _locale = defaultLocale;
    }
    DioClient().setLocale(_locale.languageCode);
    _initialized = true;
    notifyListeners();
  }

  Future<void> setLocale(Locale next) async {
    if (!_isSupported(next.languageCode)) return;
    if (_locale.languageCode == next.languageCode) return;
    _locale = Locale(next.languageCode);
    DioClient().setLocale(_locale.languageCode);
    try {
      await _storage.write(key: _storageKey, value: next.languageCode);
    } catch (_) {}
    notifyListeners();
  }

  static bool _isSupported(String code) =>
      supportedLocales.any((l) => l.languageCode == code);

  /// Used by [MaterialApp.localeResolutionCallback] to guarantee the app
  /// always falls back to French if the device locale isn't supported.
  static Locale resolve(Locale? device, Iterable<Locale> supported) {
    if (device == null) return defaultLocale;
    for (final l in supported) {
      if (l.languageCode == device.languageCode) return l;
    }
    return defaultLocale;
  }
}


