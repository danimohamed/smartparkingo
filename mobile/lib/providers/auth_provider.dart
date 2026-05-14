import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../config/google_sign_in_helper.dart';
import '../models/user.dart';
import '../services/auth_event_bus.dart';
import '../services/auth_service.dart';
import '../services/guard_chat_poll_notifications_service.dart';
import '../services/user_service.dart';
import '../utils/constants.dart';
import '../utils/secure_storage.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  final FlutterSecureStorage _storage = AppSecureStorage.instance;

  User? _user;
  bool _isLoading = false;
  String? _error;
  bool _isAuthenticated = false;

  User? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _isAuthenticated;

  Future<void> checkAuth() async {
    final token = await _storage.read(key: AppConstants.tokenKey);
    final userData = await _storage.read(key: AppConstants.userKey);
    if (token != null && userData != null) {
      _user = User.fromJson(jsonDecode(userData));
      _isAuthenticated = true;
      notifyListeners();
      await refreshProfile();
    }
  }

  Future<void> refreshProfile() async {
    try {
      final u = await UserService().getMe();
      _user = u;
      await _storage.write(
        key: AppConstants.userKey,
        value: jsonEncode(_user!.toJson()),
      );
      notifyListeners();
    } catch (_) {}
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final auth = await _authService.login(email, password);
      _user = User(
        id: auth.id,
        fullName: auth.fullName,
        email: auth.email,
        phone: auth.phone,
        role: auth.role,
        createdAt: auth.createdAt,
      );
      _isAuthenticated = true;
      await _storage.write(
        key: AppConstants.userKey,
        value: jsonEncode(_user!.toJson()),
      );
      // iOS keychain commits writes asynchronously. Give it a tick before the
      // very next authenticated request reads the freshly-written JWT.
      await Future<void>.delayed(const Duration(milliseconds: 50));
      await refreshProfile();
      // Start in-app chat polling notifications after login.
      try {
        GuardChatPollNotificationsService.instance.start();
      } catch (_) {}
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _parseError(e);
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Google OAuth — same backend contract as [AuthService.oauthLogin].
  Future<bool> loginWithGoogle() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final account = await GoogleSignInHelper.instance.signIn();
      if (account == null) {
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final email = account.email.trim();
      if (email.isEmpty) {
        _error = 'This Google account has no email. Try another account.';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final auth = await _authService.oauthLogin(
        email: email,
        fullName: (account.displayName ?? '').trim().isNotEmpty
            ? account.displayName!.trim()
            : email.split('@').first,
        image: account.photoUrl ?? '',
      );

      _user = User(
        id: auth.id,
        fullName: auth.fullName,
        email: auth.email,
        phone: auth.phone,
        role: auth.role,
        createdAt: auth.createdAt,
      );
      _isAuthenticated = true;
      await _storage.write(
        key: AppConstants.userKey,
        value: jsonEncode(_user!.toJson()),
      );
      await refreshProfile();
      try {
        GuardChatPollNotificationsService.instance.start();
      } catch (_) {}
      _isLoading = false;
      notifyListeners();
      return true;
    } on PlatformException catch (e) {
      _error = _googleSignInPlatformError(e);
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = _parseError(e);
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register({
    required String fullName,
    required String email,
    required String password,
    String? phone,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final auth = await _authService.register(
        fullName: fullName,
        email: email,
        password: password,
        phone: phone,
      );
      _user = User(
        id: auth.id,
        fullName: auth.fullName,
        email: auth.email,
        phone: auth.phone,
        role: auth.role,
        createdAt: auth.createdAt,
      );
      _isAuthenticated = true;
      await _storage.write(
        key: AppConstants.userKey,
        value: jsonEncode(_user!.toJson()),
      );
      await refreshProfile();
      try {
        GuardChatPollNotificationsService.instance.start();
      } catch (_) {}
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _parseError(e);
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    await _storage.delete(key: AppConstants.userKey);
    _user = null;
    _isAuthenticated = false;
    notifyListeners();
    try {
      GuardChatPollNotificationsService.instance.stop();
    } catch (_) {}
    AuthEventBus.instance.emit(AuthEvent.loggedOut);
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  /// [PlatformException] from Google Sign-In (e.g. Android `ApiException: 10`).
  String _googleSignInPlatformError(PlatformException e) {
    final blob = '${e.message ?? ''} ${e.details ?? ''}';
    if (blob.contains('ApiException: 10') ||
        blob.contains(': 10:') ||
        blob.contains('DEVELOPER_ERROR')) {
      return 'Google Sign-In setup error (code 10). Add this app’s debug/release '
          'SHA-1 in Firebase for package app.parkingo.mobile, re-download '
          'google-services.json, and only use a Web OAuth client ID from the '
          'same Google project (see mobile/README.md).';
    }
    return e.message ?? 'Google sign-in failed.';
  }

  String _parseError(dynamic e) {
    if (e is DioException) {
      final data = e.response?.data;
      if (data is Map) {
        final msg = data['message'] ?? data['error'] ?? data['detail'];
        if (msg is String && msg.trim().isNotEmpty) return msg;
      }
      final status = e.response?.statusCode;
      switch (e.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          return 'Connection timeout. Please try again.';
        case DioExceptionType.connectionError:
          return 'Cannot reach the server. Check your internet connection.';
        case DioExceptionType.badCertificate:
          return 'Server certificate is not trusted.';
        default:
          break;
      }
      if (status == 401 || status == 403) {
        return 'Invalid email or password.';
      }
      if (status == 503 || status == 502 || status == 504) {
        return 'Server is temporarily unavailable (HTTP $status). Please try again in a moment.';
      }
      if (status != null) {
        return 'Login failed (HTTP $status). Please try again.';
      }
      return e.message ?? 'Network error. Please try again.';
    }
    return 'An unexpected error occurred: $e';
  }
}
