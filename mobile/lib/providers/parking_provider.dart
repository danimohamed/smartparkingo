import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../models/parking.dart';
import '../models/parking_slot.dart';
import '../services/parking_service.dart';
import '../services/parking_slot_service.dart';
import '../services/location_service.dart';
import '../utils/helpers.dart';

class ParkingProvider extends ChangeNotifier {
  final ParkingService _parkingService = ParkingService();
  final ParkingSlotService _slotService = ParkingSlotService();
  final LocationService _locationService = LocationService();

  List<Parking> _parkings = [];
  List<ParkingSlot> _slots = [];
  Parking? _selectedParking;
  Position? _userLocation;
  bool _isLoading = false;
  bool _isSlotsLoading = false;
  String? _error;

  List<Parking> get parkings => _parkings;
  List<ParkingSlot> get slots => _slots;
  Parking? get selectedParking => _selectedParking;
  Position? get userLocation => _userLocation;
  bool get isLoading => _isLoading;
  bool get isSlotsLoading => _isSlotsLoading;
  String? get error => _error;

  List<Parking> get nearbyParkings {
    if (_userLocation == null) return _parkings;
    final sorted = List<Parking>.from(_parkings);
    for (var p in sorted) {
      if (p.hasLocation) {
        p.distance = Helpers.calculateDistance(
          _userLocation!.latitude,
          _userLocation!.longitude,
          p.latitude!,
          p.longitude!,
        );
      }
    }
    sorted.sort((a, b) => (a.distance ?? 999).compareTo(b.distance ?? 999));
    return sorted;
  }

  Future<void> initLocation() async {
    final position = await _locationService.getCurrentLocation();
    _userLocation = position ?? _locationService.defaultPosition;
    notifyListeners();
  }

  Future<void> loadParkings() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _parkings = await _parkingService.getActiveParkings();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = _parseError(e);
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> searchParkings(String query) async {
    if (query.isEmpty) {
      await loadParkings();
      return;
    }
    _isLoading = true;
    notifyListeners();

    try {
      _parkings = await _parkingService.searchParkings(query);
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = _parseError(e);
      _isLoading = false;
      notifyListeners();
    }
  }

  void selectParking(Parking parking) {
    _selectedParking = parking;
    notifyListeners();
  }

  void clearSelection() {
    _selectedParking = null;
    _slots = [];
    notifyListeners();
  }

  Future<void> loadAvailableSlots(int parkingId) async {
    _isSlotsLoading = true;
    notifyListeners();

    try {
      _slots = await _slotService.getAvailableSlots(parkingId);
      _isSlotsLoading = false;
      notifyListeners();
    } catch (e) {
      _error = _parseError(e);
      _isSlotsLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadAllSlots(int parkingId) async {
    _isSlotsLoading = true;
    notifyListeners();

    try {
      _slots = await _slotService.getSlotsByParking(parkingId);
      _isSlotsLoading = false;
      notifyListeners();
    } catch (e) {
      _error = _parseError(e);
      _isSlotsLoading = false;
      notifyListeners();
    }
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
