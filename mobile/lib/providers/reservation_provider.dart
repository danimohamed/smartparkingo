import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../models/reservation.dart';
import '../services/reservation_service.dart';

class ReservationProvider extends ChangeNotifier {
  final ReservationService _service = ReservationService();

  List<Reservation> _reservations = [];
  bool _isLoading = false;
  String? _error;
  String? _successMessage;

  List<Reservation> get reservations => _reservations;
  List<Reservation> get activeReservations =>
      _reservations.where((r) => r.isActive).toList();
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get successMessage => _successMessage;

  Future<void> loadReservations() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _reservations = await _service.getMyReservations();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = _parseError(e);
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Reservation?> createReservation({
    required int parkingSlotId,
    required DateTime startTime,
    required DateTime endTime,
    String? vehiclePlate,
  }) async {
    _isLoading = true;
    _error = null;
    _successMessage = null;
    notifyListeners();

    try {
      final created = await _service.createReservation(
        parkingSlotId: parkingSlotId,
        startTime: startTime,
        endTime: endTime,
        vehiclePlate: vehiclePlate,
      );
      _successMessage = 'Reservation created successfully!';
      _isLoading = false;
      notifyListeners();
      await loadReservations();
      return created;
    } catch (e) {
      _error = _parseError(e);
      _isLoading = false;
      notifyListeners();
      return null;
    }
  }

  Future<bool> cancelReservation(int id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _service.cancelReservation(id);
      _successMessage = 'Reservation cancelled.';
      _isLoading = false;
      notifyListeners();
      await loadReservations();
      return true;
    } catch (e) {
      _error = _parseError(e);
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  void clearMessages() {
    _error = null;
    _successMessage = null;
    notifyListeners();
  }

  String _parseError(dynamic e) {
    if (e is DioException) {
      final data = e.response?.data;
      if (data is Map) {
        return data['message'] as String? ?? 'An error occurred';
      }
      return 'Network error. Please try again.';
    }
    return 'An unexpected error occurred.';
  }
}
