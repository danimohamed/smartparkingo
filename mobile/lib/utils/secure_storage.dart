import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Centralised [FlutterSecureStorage] with platform-tuned options.
///
/// On iOS the default `accessibility` is `unlocked` which can lead to the
/// keychain item not being immediately visible to the very next read on real
/// devices (a classic post-login → first-authenticated-request race).
/// Using `first_unlock_this_device` is both more reliable and survives the
/// device being temporarily locked while a background request is in flight
/// (e.g. token refresh or push-notification handling on iOS).
class AppSecureStorage {
  AppSecureStorage._();

  static const FlutterSecureStorage instance = FlutterSecureStorage(
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
      synchronizable: false,
    ),
    aOptions: AndroidOptions(
      resetOnError: true,
    ),
  );
}


