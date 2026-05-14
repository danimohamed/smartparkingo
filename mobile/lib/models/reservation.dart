class Reservation {
  final int id;
  final int userId;
  final String userFullName;
  final int parkingSlotId;
  final String slotNumber;
  final String parkingName;
  final int? parkingId;
  final List<int>? guardChatIds;
  final DateTime startTime;
  final DateTime endTime;
  final String status;
  final double totalPrice;
  final DateTime? createdAt;
  final int? gracePeriodMinutes;
  final DateTime? actualArrival;
  final DateTime? actualDeparture;
  final bool? checkedIn;
  final bool? checkedOut;
  final String? paymentStatus;
  final String? paymentMethod;

  Reservation({
    required this.id,
    required this.userId,
    required this.userFullName,
    required this.parkingSlotId,
    required this.slotNumber,
    required this.parkingName,
    this.parkingId,
    this.guardChatIds,
    required this.startTime,
    required this.endTime,
    required this.status,
    required this.totalPrice,
    this.createdAt,
    this.gracePeriodMinutes,
    this.actualArrival,
    this.actualDeparture,
    this.checkedIn,
    this.checkedOut,
    this.paymentStatus,
    this.paymentMethod,
  });

  factory Reservation.fromJson(Map<String, dynamic> json) => Reservation(
        id: (json['id'] as num).toInt(),
        userId: (json['userId'] as num).toInt(),
        userFullName: json['userFullName'] as String,
        parkingSlotId: (json['parkingSlotId'] as num).toInt(),
        slotNumber: json['slotNumber'] as String,
        parkingName: json['parkingName'] as String,
        parkingId: json['parkingId'] != null ? (json['parkingId'] as num).toInt() : null,
        guardChatIds: (json['guardChatIds'] as List<dynamic>?)
            ?.map((e) => (e as num).toInt())
            .toList(),
        startTime: DateTime.parse(json['startTime'] as String),
        endTime: DateTime.parse(json['endTime'] as String),
        status: json['status'] as String,
        totalPrice: (json['totalPrice'] as num).toDouble(),
        createdAt: json['createdAt'] != null
            ? DateTime.parse(json['createdAt'] as String)
            : null,
        gracePeriodMinutes: json['gracePeriodMinutes'] != null
            ? (json['gracePeriodMinutes'] as num).toInt()
            : null,
        actualArrival: json['actualArrival'] != null
            ? DateTime.parse(json['actualArrival'] as String)
            : null,
        actualDeparture: json['actualDeparture'] != null
            ? DateTime.parse(json['actualDeparture'] as String)
            : null,
        checkedIn: json['checkedIn'] as bool?,
        checkedOut: json['checkedOut'] as bool?,
        paymentStatus: json['paymentStatus'] as String?,
        paymentMethod: json['paymentMethod'] as String?,
      );

  bool get isActive => status == 'ACTIVE';
  bool get isCancelled => status == 'CANCELLED';
  bool get isCompleted => status == 'COMPLETED';
  bool get isNoShow => status == 'NO_SHOW';
  Duration get duration => endTime.difference(startTime);
}
