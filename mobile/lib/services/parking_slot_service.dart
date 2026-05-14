import '../models/parking_slot.dart';
import '../utils/constants.dart';
import 'base_api_service.dart';
import 'dio_client.dart';

class ParkingSlotService with ApiResponseParser {
  final DioClient _client = DioClient();

  Future<List<ParkingSlot>> getSlotsByParking(int parkingId) async {
    final response =
        await _client.dio.get(ApiConstants.slotsByParking(parkingId));
    return _parseList(response.data);
  }

  Future<List<ParkingSlot>> getAvailableSlots(int parkingId) async {
    final response =
        await _client.dio.get(ApiConstants.availableSlots(parkingId));
    return _parseList(response.data);
  }

  Future<ParkingSlot> getSlotById(int id) async {
    final response = await _client.dio.get(ApiConstants.slotById(id));
    return ParkingSlot.fromJson(extractObject(response.data));
  }

  List<ParkingSlot> _parseList(dynamic data) {
    return extractList(data)
        .map((e) => ParkingSlot.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
