import 'dio_client.dart';

class CallInviteService {
  final DioClient _client = DioClient();

  Future<void> sendInvitePush(int chatId) async {
    await _client.dio.post('/calls/$chatId/invite');
  }
}

