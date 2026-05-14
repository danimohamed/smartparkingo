import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../models/payment.dart';
import '../services/payment_service.dart';

class PaymentProvider extends ChangeNotifier {
  final PaymentService _service = PaymentService();

  List<Payment> _payments = [];
  bool _isLoading = false;
  String? _error;

  List<Payment> get payments => _payments;
  bool get isLoading => _isLoading;
  String? get error => _error;

  double get totalSpent => _payments
      .where((p) => p.status == 'COMPLETED')
      .fold(0.0, (sum, p) => sum + p.amount);

  Future<void> loadPayments() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _payments = await _service.getMyPayments();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = _parseError(e);
      _isLoading = false;
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
