class Parking {
  final int id;
  final String name;
  final String address;
  final String? description;
  final int totalSlots;
  final int availableSlots;
  final double pricePerHour;
  final String? guardName;
  final String? guardPhone;
  final bool active;
  final double? latitude;
  final double? longitude;
  final DateTime? createdAt;
  double? distance; // calculated client-side

  Parking({
    required this.id,
    required this.name,
    required this.address,
    this.description,
    required this.totalSlots,
    required this.availableSlots,
    required this.pricePerHour,
    this.guardName,
    this.guardPhone,
    required this.active,
    this.latitude,
    this.longitude,
    this.createdAt,
    this.distance,
  });

  factory Parking.fromJson(Map<String, dynamic> json) => Parking(
        id: (json['id'] as num).toInt(),
        name: json['name'] as String,
        address: json['address'] as String,
        description: json['description'] as String?,
        totalSlots: (json['totalSlots'] as num).toInt(),
        availableSlots: (json['availableSlots'] as num?)?.toInt() ?? 0,
        pricePerHour: (json['pricePerHour'] as num).toDouble(),
        guardName: json['guardName'] as String?,
        guardPhone: json['guardPhone'] as String?,
        active: json['active'] as bool? ?? true,
        latitude: (json['latitude'] as num?)?.toDouble(),
        longitude: (json['longitude'] as num?)?.toDouble(),
        createdAt: json['createdAt'] != null
            ? DateTime.parse(json['createdAt'] as String)
            : null,
      );

  bool get hasLocation => latitude != null && longitude != null;
}
