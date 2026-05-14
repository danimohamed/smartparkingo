import '../models/guard_chat.dart';
import '../utils/constants.dart';
import 'base_api_service.dart';
import 'dio_client.dart';

class GuardChatService with ApiResponseParser {
  final DioClient _client = DioClient();

  Future<List<GuardChatSummary>> listChats() async {
    final response = await _client.dio.get(ApiConstants.chats);
    return extractList(response.data)
        .map((e) => GuardChatSummary.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<GuardChatMessage>> getMessages(int chatId) async {
    final response =
        await _client.dio.get(ApiConstants.chatMessages(chatId));
    return extractList(response.data)
        .map((e) => GuardChatMessage.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<GuardChatMessage> sendMessage(int chatId, String body) async {
    final response = await _client.dio.post(
      ApiConstants.chatMessages(chatId),
      data: {'body': body},
    );
    return GuardChatMessage.fromJson(extractObject(response.data));
  }
}
