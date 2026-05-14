import 'dart:math';
import 'package:intl/intl.dart';

class Helpers {
  static double calculateDistance(
      double lat1, double lon1, double lat2, double lon2) {
    const double earthRadius = 6371;
    double dLat = _deg2rad(lat2 - lat1);
    double dLon = _deg2rad(lon2 - lon1);
    double a = sin(dLat / 2) * sin(dLat / 2) +
        cos(_deg2rad(lat1)) *
            cos(_deg2rad(lat2)) *
            sin(dLon / 2) *
            sin(dLon / 2);
    double c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return earthRadius * c;
  }

  static double _deg2rad(double deg) => deg * pi / 180;

  static String formatDistance(double km) {
    if (km < 1) return '${(km * 1000).round()} m';
    return '${km.toStringAsFixed(1)} km';
  }

  static String formatPrice(double price) => '${price.toStringAsFixed(2)} MAD';

  static String formatDate(DateTime d) =>
      DateFormat('dd MMM yyyy, HH:mm').format(d);

  static String formatDateShort(DateTime d) =>
      DateFormat('dd/MM/yyyy').format(d);

  static String formatTime(DateTime d) => DateFormat('HH:mm').format(d);

  static String formatDuration(Duration d) {
    int h = d.inHours;
    int m = d.inMinutes.remainder(60);
    if (h > 0 && m > 0) return '${h}h ${m}min';
    if (h > 0) return '${h}h';
    return '${m}min';
  }

  static String slotStatusLabel(String s) {
    switch (s.toUpperCase()) {
      case 'AVAILABLE':
        return 'Available';
      case 'OCCUPIED':
        return 'Occupied';
      case 'RESERVED':
        return 'Reserved';
      case 'MAINTENANCE':
        return 'Maintenance';
      default:
        return s;
    }
  }

  static String reservationStatusLabel(String s) {
    switch (s.toUpperCase()) {
      case 'ACTIVE':
        return 'Active';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      case 'NO_SHOW':
        return 'No-show';
      default:
        return s;
    }
  }

  static String paymentStatusLabel(String s) {
    switch (s.toUpperCase()) {
      case 'PENDING':
        return 'Pending';
      case 'COMPLETED':
        return 'Completed';
      case 'FAILED':
        return 'Failed';
      case 'REFUNDED':
        return 'Refunded';
      default:
        return s;
    }
  }
}
