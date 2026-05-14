import '../models/payment.dart';
import '../utils/constants.dart';
import 'base_api_service.dart';
import 'dio_client.dart';

class PaymentService with ApiResponseParser {
  final DioClient _client = DioClient();

  Future<List<Payment>> getMyPayments() async {
    final response = await _client.dio.get(ApiConstants.myPayments);
    return _parseList(response.data);
  }

  Future<Payment> getPaymentByReservation(int reservationId) async {
    final response = await _client.dio
        .get(ApiConstants.paymentByReservation(reservationId));
    return Payment.fromJson(extractObject(response.data));
  }

  List<Payment> _parseList(dynamic data) {
    return extractList(data)
        .map((e) => Payment.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
