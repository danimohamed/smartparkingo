class WalkInSession {
  final int id;
  final int parkingId;
  final String parkingName;
  final int? parkingSlotId;
  final String? slotNumber;
  final String plateNormalized;
  final String? plateRaw;
  final DateTime entryTime;
  final DateTime? exitTime;
  final String status;
  final double pricePerHourSnapshot;
  final double? amountDue;

  WalkInSession({
    required this.id,
    required this.parkingId,
    required this.parkingName,
    this.parkingSlotId,
    this.slotNumber,
    required this.plateNormalized,
    this.plateRaw,
    required this.entryTime,
    this.exitTime,
    required this.status,
    required this.pricePerHourSnapshot,
    this.amountDue,
  });

  factory WalkInSession.fromJson(Map<String, dynamic> json) => WalkInSession(
        id: (json['id'] as num).toInt(),
        parkingId: (json['parkingId'] as num).toInt(),
        parkingName: json['parkingName'] as String,
        parkingSlotId: json['parkingSlotId'] != null
            ? (json['parkingSlotId'] as num).toInt()
            : null,
        slotNumber: json['slotNumber'] as String?,
        plateNormalized: json['plateNormalized'] as String,
        plateRaw: json['plateRaw'] as String?,
        entryTime: DateTime.parse(json['entryTime'] as String),
        exitTime: json['exitTime'] != null
            ? DateTime.parse(json['exitTime'] as String)
            : null,
        status: json['status'] as String,
        pricePerHourSnapshot: (json['pricePerHourSnapshot'] as num).toDouble(),
        amountDue: json['amountDue'] != null
            ? (json['amountDue'] as num).toDouble()
            : null,
      );
}
