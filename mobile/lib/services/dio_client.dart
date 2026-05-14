import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../utils/constants.dart';
import '../utils/secure_storage.dart';
import 'auth_event_bus.dart';

class DioClient {
  static DioClient? _instance;
  late final Dio _dio;
  final FlutterSecureStorage _storage = AppSecureStorage.instance;

  /// Active language code injected as the `Accept-Language` header on every
  /// request. Defaults to French per project policy and is updated by
  /// [LocaleProvider] whenever the user switches language.
  String _localeCode = 'fr';

  void setLocale(String code) {
    if (code.isEmpty) return;
    _localeCode = code;
  }

  DioClient._() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: AppConstants.tokenKey);
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          // Forward locale to Spring Boot's AcceptHeaderLocaleResolver.
          options.headers['Accept-Language'] = _localeCode;
          // Counter for the 5xx retry policy below.
          options.extra['retryCount'] ??= 0;
          handler.next(options);
        },
        onError: (error, handler) async {
          final status = error.response?.statusCode;

          // Auto-retry transient backend failures (Heroku cold-start, brief 5xx,
          // network blips). The backend may return 502/503/504 while the dyno
          // is waking up — give it up to 3 tries with exponential backoff.
          final isTransient = status == null
              ? (error.type == DioExceptionType.connectionError ||
                  error.type == DioExceptionType.connectionTimeout ||
                  error.type == DioExceptionType.receiveTimeout ||
                  error.type == DioExceptionType.sendTimeout)
              : (status == 502 || status == 503 || status == 504);

          final req = error.requestOptions;
          final attempt = (req.extra['retryCount'] as int?) ?? 0;
          if (isTransient && attempt < 2) {
            final delayMs = 800 * (1 << attempt); // 800ms, 1600ms
            await Future<void>.delayed(Duration(milliseconds: delayMs));
            req.extra['retryCount'] = attempt + 1;
            try {
              final cloned = await _dio.fetch<dynamic>(req);
              return handler.resolve(cloned);
            } catch (_) {
              // fall through to normal error handling
            }
          }

          if (status == 401) {
            // JWT expired / rejected — clear local credentials and notify the
            // app shell so it can hard-redirect to the LoginScreen.
            try {
              await _storage.delete(key: AppConstants.tokenKey);
              await _storage.delete(key: AppConstants.userKey);
            } catch (_) {}
            AuthEventBus.instance.emit(AuthEvent.sessionExpired);
          }
          handler.next(error);
        },
      ),
    );
  }

  factory DioClient() {
    _instance ??= DioClient._();
    return _instance!;
  }

  Dio get dio => _dio;

  Future<void> setToken(String token) async {
    await _storage.write(key: AppConstants.tokenKey, value: token);
  }

  Future<String?> getToken() async {
    return await _storage.read(key: AppConstants.tokenKey);
  }

  Future<void> clearToken() async {
    await _storage.delete(key: AppConstants.tokenKey);
  }
}
