import '../config/google_sign_in_helper.dart';
import '../models/user.dart';
import '../utils/constants.dart';
import 'dio_client.dart';

class AuthService {
  final DioClient _client = DioClient();

  /// Coerces any nested JSON object Dio decoded as `Map<dynamic, dynamic>`
  /// into the strict `Map<String, dynamic>` our `fromJson` factories expect.
  /// In iOS release builds the implicit cast occasionally fails — be explicit.
  Map<String, dynamic> _unwrap(dynamic apiData) {
    if (apiData is Map) {
      final inner = apiData.containsKey('data') ? apiData['data'] : apiData;
      if (inner is Map) {
        return inner.map((key, value) => MapEntry(key.toString(), value));
      }
    }
    throw StateError('Unexpected auth response shape: $apiData');
  }

  Future<AuthResponse> login(String email, String password) async {
    final response = await _client.dio.post(
      ApiConstants.login,
      data: {'email': email, 'password': password},
    );

    final authResponse = AuthResponse.fromJson(_unwrap(response.data));
    await _client.setToken(authResponse.token);
    return authResponse;
  }

  /// Same contract as web NextAuth → `/api/auth/oauth-login` (email + fullName + optional image).
  Future<AuthResponse> oauthLogin({
    required String email,
    required String fullName,
    String? image,
  }) async {
    final response = await _client.dio.post(
      ApiConstants.oauthLogin,
      data: {
        'email': email,
        'fullName': fullName,
        'image': image ?? '',
      },
    );

    final authResponse = AuthResponse.fromJson(_unwrap(response.data));
    await _client.setToken(authResponse.token);
    return authResponse;
  }

  Future<AuthResponse> register({
    required String fullName,
    required String email,
    required String password,
    String? phone,
  }) async {
    final response = await _client.dio.post(
      ApiConstants.register,
      data: {
        'fullName': fullName,
        'email': email,
        'password': password,
        if (phone != null && phone.isNotEmpty) 'phone': phone,
      },
    );

    final authResponse = AuthResponse.fromJson(_unwrap(response.data));
    await _client.setToken(authResponse.token);
    return authResponse;
  }

  Future<void> logout() async {
    await GoogleSignInHelper.instance.signOut();
    await _client.clearToken();
  }

  Future<bool> isLoggedIn() async {
    final token = await _client.getToken();
    return token != null && token.isNotEmpty;
  }
}
