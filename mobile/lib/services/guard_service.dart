import '../models/guard_scan_result.dart';
import '../models/guard_plate_lookup_result.dart';
import '../models/guard_plate_scan_flow_result.dart';
import '../models/guard_plate_scan_stats.dart';
import '../models/plate_ocr_response.dart';
import '../models/reservation.dart';
import '../models/walk_in_session.dart';
import '../utils/constants.dart';
import 'dio_client.dart';
import 'package:dio/dio.dart';

class GuardService {
  final DioClient _client = DioClient();

  Map<String, dynamic> _object(dynamic data) {
    if (data is Map<String, dynamic> && data.containsKey('data')) {
      return data['data'] as Map<String, dynamic>;
    }
    return data as Map<String, dynamic>;
  }

  Future<GuardScanResult> validateEntry(String qrPayload) async {
    final response = await _client.dio.post(
      ApiConstants.guardValidateEntry,
      data: {'qrPayload': qrPayload},
    );
    return GuardScanResult.fromJson(_object(response.data));
  }

  Future<GuardScanResult> validateExit(String qrPayload) async {
    final response = await _client.dio.post(
      ApiConstants.guardValidateExit,
      data: {'qrPayload': qrPayload},
    );
    return GuardScanResult.fromJson(_object(response.data));
  }

  Future<GuardScanResult> validateEntryManual(int reservationId) async {
    final response = await _client.dio.post(
      ApiConstants.guardValidateEntryManual,
      data: {'reservationId': reservationId},
    );
    return GuardScanResult.fromJson(_object(response.data));
  }

  Future<GuardScanResult> validateExitManual(int reservationId) async {
    final response = await _client.dio.post(
      ApiConstants.guardValidateExitManual,
      data: {'reservationId': reservationId},
    );
    return GuardScanResult.fromJson(_object(response.data));
  }

  Future<List<Reservation>> activeBookingsForParking(int parkingId) async {
    final response = await _client.dio.get(
      ApiConstants.guardActiveBookings(parkingId),
    );
    final data = response.data;
    final list = data is Map && data['data'] is List
        ? data['data'] as List<dynamic>
        : data is List
            ? data
            : <dynamic>[];
    return list
        .map((e) => Reservation.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> manualOccupySlot(int slotId) async {
    await _client.dio.post(ApiConstants.guardManualOccupy(slotId));
  }

  Future<void> manualFreeSlot(int slotId) async {
    await _client.dio.post(ApiConstants.guardManualFree(slotId));
  }

  Future<Map<String, dynamic>> plateEntry({
    required int parkingId,
    required String plate,
    int? parkingSlotId,
    String? notes,
  }) async {
    final data = <String, dynamic>{
      'parkingId': parkingId,
      'plate': plate,
    };
    if (parkingSlotId != null) {
      data['parkingSlotId'] = parkingSlotId;
    }
    final trimmedNotes = notes?.trim();
    if (trimmedNotes != null && trimmedNotes.isNotEmpty) {
      data['notes'] = trimmedNotes;
    }

    final response = await _client.dio.post(
      ApiConstants.guardPlateEntry,
      data: data,
    );
    return _object(response.data);
  }

  Future<Map<String, dynamic>> plateExit({
    required int parkingId,
    required String plate,
    bool paidOnExit = false,
  }) async {
    final response = await _client.dio.post(
      ApiConstants.guardPlateExit,
      data: {
        'parkingId': parkingId,
        'plate': plate,
        'paidOnExit': paidOnExit,
      },
    );
    return _object(response.data);
  }

  Future<PlateOcrResponse> plateOcr({
    required String filePath,
    String filename = 'plate.jpg',
  }) async {
    final form = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath, filename: filename),
    });
    final response = await _client.dio.post(
      ApiConstants.guardPlateOcr,
      data: form,
      options: Options(contentType: 'multipart/form-data'),
    );
    return PlateOcrResponse.fromJson(_object(response.data));
  }

  Future<GuardPlateScanFlowResult> scanPlateFlow({
    required int parkingId,
    required String filePath,
    String filename = 'plate.jpg',
  }) async {
    final form = FormData.fromMap({
      'parkingId': parkingId,
      'file': await MultipartFile.fromFile(filePath, filename: filename),
    });
    final response = await _client.dio.post(
      ApiConstants.guardPlateScan,
      data: form,
      options: Options(contentType: 'multipart/form-data'),
    );
    return GuardPlateScanFlowResult.fromJson(_object(response.data));
  }

  Future<GuardPlateLookupResult> lookupPlate({
    required int parkingId,
    required String plate,
  }) async {
    final response = await _client.dio.get(
      ApiConstants.guardPlateLookup(parkingId: parkingId, plate: plate),
    );
    return GuardPlateLookupResult.fromJson(_object(response.data));
  }

  Future<List<WalkInSession>> activeWalkIns(int parkingId) async {
    final response =
        await _client.dio.get(ApiConstants.guardActiveWalkIns(parkingId));
    final data = response.data;
    final list = data is Map && data['data'] is List
        ? data['data'] as List<dynamic>
        : data is List
            ? data
            : <dynamic>[];
    return list
        .map((e) => WalkInSession.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> markWalkInPaid(int sessionId) async {
    await _client.dio.post(ApiConstants.guardMarkWalkInPaid(sessionId));
  }

  Future<GuardPlateScanStats> getTodayPlateScanStats(int parkingId) async {
    final response = await _client.dio.get(
      ApiConstants.guardTodayPlateScanStats(parkingId),
    );
    return GuardPlateScanStats.fromJson(_object(response.data));
  }
}
