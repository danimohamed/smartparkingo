import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../models/wallet.dart';
import '../models/reservation.dart';
import '../services/wallet_service.dart';
import '../services/reservation_service.dart';

class WalletProvider extends ChangeNotifier {
  final WalletService _walletService = WalletService();
  final ReservationService _reservationService = ReservationService();

  Wallet? _wallet;
  List<WalletTransaction> _transactions = [];
  List<Reservation> _pendingReservations = [];
  bool _isLoading = false;
  String? _error;
  String? _successMessage;

  Wallet? get wallet => _wallet;
  double get balance => _wallet?.balance ?? 0.0;
  List<WalletTransaction> get transactions => _transactions;
  List<Reservation> get pendingReservations => _pendingReservations;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get successMessage => _successMessage;

  void clearMessages() {
    _error = null;
    _successMessage = null;
    notifyListeners();
  }

  Future<void> loadWallet() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        _walletService.getBalance(),
        _walletService.getTransactions(),
        _reservationService.getMyReservations().catchError((_) => <Reservation>[]),
      ]);

      _wallet = results[0] as Wallet;
      _transactions = results[1] as List<WalletTransaction>;
      final allReservations = results[2] as List<Reservation>;
      _pendingReservations =
          allReservations.where((r) => r.status == 'ACTIVE').toList();
    } catch (e) {
      _error = _parseError(e);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> topUp({
    required double amount,
    required String cardNumber,
    required String cardHolder,
    required String expiryDate,
    required String cvv,
  }) async {
    _isLoading = true;
    _error = null;
    _successMessage = null;
    notifyListeners();

    try {
      _wallet = await _walletService.topUp(
        amount: amount,
        cardNumber: cardNumber,
        cardHolder: cardHolder,
        expiryDate: expiryDate,
        cvv: cvv,
      );
      _transactions = await _walletService.getTransactions();
      _successMessage = 'Added ${amount.toStringAsFixed(0)} MAD to wallet!';
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _parseError(e);
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> payForReservation(int reservationId) async {
    _isLoading = true;
    _error = null;
    _successMessage = null;
    notifyListeners();

    try {
      _wallet = await _walletService.payForReservation(reservationId);
      _transactions = await _walletService.getTransactions();
      final allRes = await _reservationService.getMyReservations().catchError((_) => <Reservation>[]);
      _pendingReservations = allRes.where((r) => r.status == 'ACTIVE').toList();
      _successMessage = 'Payment successful!';
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _parseError(e);
      _isLoading = false;
      notifyListeners();
      return false;
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

