class Wallet {
  final int id;
  final double balance;
  final DateTime? updatedAt;

  Wallet({
    required this.id,
    required this.balance,
    this.updatedAt,
  });

  factory Wallet.fromJson(Map<String, dynamic> json) => Wallet(
        id: json['id'] as int,
        balance: (json['balance'] as num).toDouble(),
        updatedAt: json['updatedAt'] != null
            ? DateTime.parse(json['updatedAt'] as String)
            : null,
      );
}

class WalletTransaction {
  final int id;
  final String type;
  final double amount;
  final String? description;
  final String? cardLast4;
  final DateTime? createdAt;

  WalletTransaction({
    required this.id,
    required this.type,
    required this.amount,
    this.description,
    this.cardLast4,
    this.createdAt,
  });

  factory WalletTransaction.fromJson(Map<String, dynamic> json) =>
      WalletTransaction(
        id: json['id'] as int,
        type: json['type'] as String,
        amount: (json['amount'] as num).toDouble(),
        description: json['description'] as String?,
        cardLast4: json['cardLast4'] as String?,
        createdAt: json['createdAt'] != null
            ? DateTime.parse(json['createdAt'] as String)
            : null,
      );

  bool get isTopUp => type == 'TOP_UP';
  bool get isPayment => type == 'PAYMENT';
  bool get isRefund => type == 'REFUND';
}

