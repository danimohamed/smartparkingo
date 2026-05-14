import '../models/wallet.dart';
import '../utils/constants.dart';
import 'base_api_service.dart';
import 'dio_client.dart';

class WalletService with ApiResponseParser {
  final DioClient _client = DioClient();

  Future<Wallet> getBalance() async {
    final response = await _client.dio.get(ApiConstants.walletBalance);
    return Wallet.fromJson(extractObject(response.data));
  }

  Future<Wallet> topUp({
    required double amount,
    required String cardNumber,
    required String cardHolder,
    required String expiryDate,
    required String cvv,
  }) async {
    final response = await _client.dio.post(
      ApiConstants.walletTopUp,
      data: {
        'amount': amount,
        'cardNumber': cardNumber,
        'cardHolder': cardHolder,
        'expiryDate': expiryDate,
        'cvv': cvv,
      },
    );
    return Wallet.fromJson(extractObject(response.data));
  }

  Future<Wallet> payForReservation(int reservationId) async {
    final response = await _client.dio.post(
      ApiConstants.walletPay,
      data: {'reservationId': reservationId},
    );
    return Wallet.fromJson(extractObject(response.data));
  }

  Future<List<WalletTransaction>> getTransactions() async {
    final response = await _client.dio.get(ApiConstants.walletTransactions);
    return extractList(response.data)
        .map((e) => WalletTransaction.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}

