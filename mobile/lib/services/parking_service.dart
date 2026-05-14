import '../models/parking.dart';
import '../utils/constants.dart';
import 'base_api_service.dart';
import 'dio_client.dart';

class ParkingService with ApiResponseParser {
  final DioClient _client = DioClient();

  Future<List<Parking>> getAllParkings() async {
    final response = await _client.dio.get(ApiConstants.parkings);
    return _parseList(response.data);
  }

  Future<List<Parking>> getActiveParkings() async {
    final response = await _client.dio.get(ApiConstants.activeParkings);
    return _parseList(response.data);
  }

  Future<Parking> getParkingById(int id) async {
    final response = await _client.dio.get(ApiConstants.parkingById(id));
    return Parking.fromJson(extractObject(response.data));
  }

  Future<List<Parking>> searchParkings(String name) async {
    final response = await _client.dio.get(ApiConstants.searchParkings(name));
    return _parseList(response.data);
  }

  List<Parking> _parseList(dynamic data) {
    return extractList(data)
        .map((e) => Parking.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
