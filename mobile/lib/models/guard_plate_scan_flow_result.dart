import 'reservation.dart';

class GuardPlateScanFlowResult {
  final String? plate;
  final bool appUser;
  final String message;
  final Reservation? reservation;
  final int appUsersToday;
  final int nonAppUsersToday;

  GuardPlateScanFlowResult({
    required this.plate,
    required this.appUser,
    required this.message,
    required this.reservation,
    required this.appUsersToday,
    required this.nonAppUsersToday,
  });

  factory GuardPlateScanFlowResult.fromJson(Map<String, dynamic> json) {
    return GuardPlateScanFlowResult(
      plate: json['plate'] as String?,
      appUser: json['appUser'] as bool? ?? false,
      message: json['message'] as String? ?? '',
      reservation: json['reservation'] != null
          ? Reservation.fromJson(json['reservation'] as Map<String, dynamic>)
          : null,
      appUsersToday: (json['appUsersToday'] as num?)?.toInt() ?? 0,
      nonAppUsersToday: (json['nonAppUsersToday'] as num?)?.toInt() ?? 0,
    );
  }
}

