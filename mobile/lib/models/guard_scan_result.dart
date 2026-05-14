import 'reservation.dart';

class GuardScanResult {
  final bool valid;
  final String message;
  final Reservation? reservation;

  GuardScanResult({
    required this.valid,
    required this.message,
    this.reservation,
  });

  factory GuardScanResult.fromJson(Map<String, dynamic> json) {
    return GuardScanResult(
      valid: json['valid'] as bool? ?? false,
      message: json['message'] as String? ?? '',
      reservation: json['reservation'] != null
          ? Reservation.fromJson(json['reservation'] as Map<String, dynamic>)
          : null,
    );
  }
}
