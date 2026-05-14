class ParkingSlot {
  final int id;
  final String slotNumber;
  final String status;
  final String slotType;
  final String? floor;
  final int parkingId;
  final String parkingName;
  final DateTime? createdAt;

  ParkingSlot({
    required this.id,
    required this.slotNumber,
    required this.status,
    required this.slotType,
    this.floor,
    required this.parkingId,
    required this.parkingName,
    this.createdAt,
  });

  factory ParkingSlot.fromJson(Map<String, dynamic> json) => ParkingSlot(
        id: json['id'] as int,
        slotNumber: json['slotNumber'] as String,
        status: json['status'] as String,
        slotType: json['slotType'] as String,
        floor: json['floor'] as String?,
        parkingId: json['parkingId'] as int,
        parkingName: json['parkingName'] as String,
        createdAt: json['createdAt'] != null
            ? DateTime.parse(json['createdAt'] as String)
            : null,
      );

  bool get isAvailable => status == 'AVAILABLE';
}
