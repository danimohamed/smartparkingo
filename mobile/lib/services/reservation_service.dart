import '../models/reservation.dart';
import '../utils/constants.dart';
import 'base_api_service.dart';
import 'dio_client.dart';

class ReservationService with ApiResponseParser {
  final DioClient _client = DioClient();

  Future<Reservation> createReservation({
    required int parkingSlotId,
    required DateTime startTime,
    required DateTime endTime,
    String? vehiclePlate,
  }) async {
    final plate = vehiclePlate?.trim();
    final response = await _client.dio.post(
      ApiConstants.reservations,
      data: {
        'parkingSlotId': parkingSlotId,
        'startTime': startTime.toIso8601String(),
        'endTime': endTime.toIso8601String(),
        if (plate != null && plate.isNotEmpty) 'vehiclePlate': plate,
      },
    );
    return Reservation.fromJson(extractObject(response.data));
  }

  Future<List<Reservation>> getMyReservations() async {
    final response = await _client.dio.get(ApiConstants.myReservations);
    return _parseList(response.data);
  }

  Future<Reservation> getReservationById(int id) async {
    final response =
        await _client.dio.get(ApiConstants.reservationById(id));
    return Reservation.fromJson(extractObject(response.data));
  }

  Future<Reservation> cancelReservation(int id) async {
    final response =
        await _client.dio.put(ApiConstants.cancelReservation(id));
    return Reservation.fromJson(extractObject(response.data));
  }

  /// Signed QR token string for [QrImageView] (refreshed periodically).
  Future<String> getQrToken(int reservationId) async {
    final response =
        await _client.dio.get(ApiConstants.reservationQr(reservationId));
    final map = extractObject(response.data);
    return map['qrData'] as String;
  }

  List<Reservation> _parseList(dynamic data) {
    return extractList(data)
        .map((e) => Reservation.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
