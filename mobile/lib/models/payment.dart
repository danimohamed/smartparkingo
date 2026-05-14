class Payment {
  final int id;
  final int reservationId;
  final int userId;
  final double amount;
  final String status;
  final String? paymentMethod;
  final DateTime? paidAt;

  Payment({
    required this.id,
    required this.reservationId,
    required this.userId,
    required this.amount,
    required this.status,
    this.paymentMethod,
    this.paidAt,
  });

  factory Payment.fromJson(Map<String, dynamic> json) => Payment(
        id: json['id'] as int,
        reservationId: json['reservationId'] as int,
        userId: json['userId'] as int,
        amount: (json['amount'] as num).toDouble(),
        status: json['status'] as String,
        paymentMethod: json['paymentMethod'] as String?,
        paidAt: json['paidAt'] != null
            ? DateTime.parse(json['paidAt'] as String)
            : null,
      );
}
