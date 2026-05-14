import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

import '../models/parking.dart';
import '../models/navigation_route.dart';
import '../services/navigation_service.dart';
import '../services/location_service.dart';
import '../services/tts_service.dart';

enum NavState { idle, loading, navigating, arrived, error }

class NavigationProvider extends ChangeNotifier {
  final NavigationService _navService = NavigationService();
  final LocationService _locService = LocationService();
  final TtsService _tts = TtsService();

  // State
  NavState _state = NavState.idle;
  NavState get state => _state;

  Parking? _destination;
  Parking? get destination => _destination;

  NavigationRoute? _route;
  NavigationRoute? get route => _route;

  LatLng? _userPosition;
  LatLng? get userPosition => _userPosition;

  double _userHeading = 0;
  double get userHeading => _userHeading;

  double _speed = 0;
  double get speed => _speed;
  String get speedText => '${_speed.round()} km/h';

  bool _nightMode = false;
  bool get nightMode => _nightMode;

  int _progressIndex = 0;
  int get progressIndex => _progressIndex;

  double _remainingDistance = 0;
  double get remainingDistance => _remainingDistance;
  String get remainingDistanceText => NavigationRoute.formatDistance(_remainingDistance);

  double _remainingDuration = 0;
  String get etaText {
    if (_remainingDuration <= 0) return '--';
    final arrival = DateTime.now().add(Duration(seconds: _remainingDuration.round()));
    return '${arrival.hour.toString().padLeft(2, '0')}:${arrival.minute.toString().padLeft(2, '0')}';
  }

  String get remainingDurationText => NavigationRoute.formatDuration(_remainingDuration);

  NavigationStep? _currentStep;
  NavigationStep? get currentStep => _currentStep;

  NavigationStep? _nextStep;
  NavigationStep? get nextStep => _nextStep;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  bool _voiceEnabled = true;
  bool get voiceEnabled => _voiceEnabled;

  StreamSubscription<Position>? _positionSub;
  int _lastSpokenStepIndex = -1;
  bool _isRecalculating = false;

  /// Start navigation to a parking
  Future<void> startNavigation(Parking parking) async {
    _state = NavState.loading;
    _destination = parking;
    _errorMessage = null;
    notifyListeners();

    await _tts.init();

    // Get initial position
    final pos = await _locService.getCurrentLocation();
    if (pos != null) {
      _userPosition = LatLng(pos.latitude, pos.longitude);
    } else {
      _state = NavState.error;
      _errorMessage = 'Could not get your location';
      notifyListeners();
      return;
    }

    // Fetch route
    final success = await _fetchRoute();
    if (!success) {
      _state = NavState.error;
      _errorMessage = 'Could not calculate route';
      notifyListeners();
      return;
    }

    _state = NavState.navigating;
    notifyListeners();

    // Voice: announce start
    if (_voiceEnabled && _route!.steps.isNotEmpty) {
      _tts.speak('Navigation started. ${_route!.steps.first.voiceInstruction}');
    } else if (_voiceEnabled) {
      _tts.speak('Navigation started. Head towards ${parking.name}');
    }

    // Start listening to position updates
    _startTracking();
  }

  Future<bool> _fetchRoute() async {
    if (_userPosition == null || _destination == null || !_destination!.hasLocation) {
      return false;
    }
    try {
      _route = await _navService.getRoute(
        userLat: _userPosition!.latitude,
        userLng: _userPosition!.longitude,
        parkingLat: _destination!.latitude!,
        parkingLng: _destination!.longitude!,
      );
      _remainingDistance = _route!.distanceMeters > 0
          ? _route!.distanceMeters
          : NavigationService.remainingDistance(_route!.points, 0);
      _remainingDuration = _route!.durationSeconds;
      _updateCurrentStep();
      return _route!.points.isNotEmpty;
    } catch (_) {
      return false;
    }
  }

  void _startTracking() {
    _positionSub?.cancel();
    _positionSub = _locService.getLocationStream().listen(_onPositionUpdate);
  }

  void _onPositionUpdate(Position pos) {
    if (_state != NavState.navigating || _route == null) return;

    _userPosition = LatLng(pos.latitude, pos.longitude);
    _userHeading = pos.heading;

    // Speed from GPS (m/s -> km/h)
    if (pos.speed > 0) {
      _speed = pos.speed * 3.6;
    } else {
      _speed = 0;
    }

    // Check arrival (within 30m of destination)
    final destLatLng = LatLng(_destination!.latitude!, _destination!.longitude!);
    final distToDest =
        const Distance().as(LengthUnit.Meter, _userPosition!, destLatLng);

    if (distToDest < 30) {
      _speed = 0;
      _onArrived();
      return;
    }

    // Check deviation from route
    if (!_isRecalculating &&
        NavigationService.hasDeviated(_userPosition!, _route!.points, thresholdMeters: 50)) {
      _recalculateRoute();
    } else {
      // Update remaining distance + step + progress index
      final closestIdx =
          NavigationService.closestPointIndex(_userPosition!, _route!.points);
      _progressIndex = closestIdx;
      _remainingDistance =
          NavigationService.remainingDistance(_route!.points, closestIdx);

      // Estimate remaining duration proportionally
      if (_route!.distanceMeters > 0) {
        _remainingDuration =
            _route!.durationSeconds * (_remainingDistance / _route!.distanceMeters);
      }

      _updateCurrentStep();
    }

    notifyListeners();
  }

  void _updateCurrentStep() {
    if (_route == null || _route!.steps.isEmpty || _userPosition == null) return;

    const dist = Distance();
    double minDist = double.infinity;
    int stepIdx = 0;
    for (int i = 0; i < _route!.steps.length; i++) {
      final d = dist.as(LengthUnit.Meter, _userPosition!, _route!.steps[i].location);
      if (d < minDist) {
        minDist = d;
        stepIdx = i;
      }
    }

    _currentStep = _route!.steps[stepIdx];
    _nextStep = stepIdx + 1 < _route!.steps.length
        ? _route!.steps[stepIdx + 1]
        : null;

    // Speak step instruction when approaching (within 80m) and not yet spoken
    if (_voiceEnabled && minDist < 80 && stepIdx != _lastSpokenStepIndex) {
      _lastSpokenStepIndex = stepIdx;
      _tts.speak(_currentStep!.voiceInstruction);
    }
  }

  Future<void> _recalculateRoute() async {
    if (_isRecalculating) return;
    _isRecalculating = true;
    notifyListeners();

    if (_voiceEnabled) {
      _tts.speak('Recalculating route');
    }

    await _fetchRoute();
    _lastSpokenStepIndex = -1;
    _isRecalculating = false;
    notifyListeners();
  }

  void _onArrived() {
    _state = NavState.arrived;
    if (_voiceEnabled) {
      _tts.speak('You have arrived at ${_destination?.name ?? "your destination"}');
    }
    _positionSub?.cancel();
    notifyListeners();
  }

  void toggleVoice() {
    _voiceEnabled = !_voiceEnabled;
    if (!_voiceEnabled) _tts.stop();
    notifyListeners();
  }

  void toggleNightMode() {
    _nightMode = !_nightMode;
    notifyListeners();
  }

  void stopNavigation() {
    _state = NavState.idle;
    _positionSub?.cancel();
    _route = null;
    _destination = null;
    _currentStep = null;
    _nextStep = null;
    _remainingDistance = 0;
    _remainingDuration = 0;
    _lastSpokenStepIndex = -1;
    _isRecalculating = false;
    _speed = 0;
    _progressIndex = 0;
    _nightMode = false;
    _tts.stop();
    notifyListeners();
  }

  @override
  void dispose() {
    _positionSub?.cancel();
    _tts.dispose();
    super.dispose();
  }
}
