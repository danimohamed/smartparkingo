import 'dart:convert';

import 'package:web_socket_channel/web_socket_channel.dart';

import 'dio_client.dart';
import '../utils/constants.dart';

/// Minimal signaling client for WebRTC audio calls.
///
/// Backend endpoint: ws://HOST:8080/ws/call?room=CHAT_ID&token=JWT
class CallSignalingService {
  final DioClient _client = DioClient();

  WebSocketChannel? _channel;

  Future<WebSocketChannel> connect({required int roomId}) async {
    final token = await _client.getToken();
    if (token == null || token.isEmpty) {
      throw Exception('Not signed in');
    }

    final wsBase = _wsBaseFromApi(ApiConstants.baseUrl);
    final uri = Uri.parse('$wsBase/ws/call').replace(queryParameters: {
      'room': roomId.toString(),
      'token': token,
    });

    _channel = WebSocketChannel.connect(uri);
    return _channel!;
  }

  void send(Map<String, dynamic> payload) {
    final ch = _channel;
    if (ch == null) return;
    ch.sink.add(jsonEncode(payload));
  }

  Future<void> close() async {
    final ch = _channel;
    _channel = null;
    await ch?.sink.close();
  }
}

String _wsBaseFromApi(String apiBaseUrl) {
  // apiBaseUrl example: http://10.0.2.2:8080/api
  final u = Uri.parse(apiBaseUrl);
  final scheme = u.scheme == 'https' ? 'wss' : 'ws';
  final basePath = u.path.endsWith('/api') ? u.path.substring(0, u.path.length - 3) : u.path;
  return Uri(
    scheme: scheme,
    host: u.host,
    port: u.hasPort ? u.port : null,
    path: basePath,
  ).toString();
}

