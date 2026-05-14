import 'reservation.dart';

class GuardPlateLookupResult {
  final bool found;
  final String plateNormalized;
  final String message;
  final Reservation? reservation;

  GuardPlateLookupResult({
    required this.found,
    required this.plateNormalized,
    required this.message,
    required this.reservation,
  });

  factory GuardPlateLookupResult.fromJson(Map<String, dynamic> json) {
    return GuardPlateLookupResult(
      found: json['found'] as bool? ?? false,
      plateNormalized: json['plateNormalized'] as String? ?? '',
      message: json['message'] as String? ?? '',
      reservation: json['reservation'] != null
          ? Reservation.fromJson(json['reservation'] as Map<String, dynamic>)
          : null,
    );
  }
}

