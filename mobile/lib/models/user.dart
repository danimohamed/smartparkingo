class User {
  final int id;
  final String fullName;
  final String email;
  final String? phone;
  final String role;
  final DateTime? createdAt;
  final int? assignedParkingId;
  final String? assignedParkingName;
  /// Normalized plate for booking prefills (nullable).
  final String? defaultVehiclePlate;

  User({
    required this.id,
    required this.fullName,
    required this.email,
    this.phone,
    required this.role,
    this.createdAt,
    this.assignedParkingId,
    this.assignedParkingName,
    this.defaultVehiclePlate,
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: (json['id'] as num).toInt(),
        fullName: json['fullName'] as String,
        email: json['email'] as String,
        phone: json['phone'] as String?,
        role: json['role'] as String,
        createdAt: json['createdAt'] != null
            ? DateTime.parse(json['createdAt'] as String)
            : null,
        assignedParkingId: json['assignedParkingId'] != null
            ? (json['assignedParkingId'] as num).toInt()
            : null,
        assignedParkingName: json['assignedParkingName'] as String?,
        defaultVehiclePlate: json['defaultVehiclePlate'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'fullName': fullName,
        'email': email,
        'phone': phone,
        'role': role,
        'createdAt': createdAt?.toIso8601String(),
        'assignedParkingId': assignedParkingId,
        'assignedParkingName': assignedParkingName,
        'defaultVehiclePlate': defaultVehiclePlate,
      };
}

class AuthResponse {
  final String token;
  final String type;
  final int id;
  final String fullName;
  final String email;
  final String? phone;
  final String role;
  final DateTime? createdAt;

  AuthResponse({
    required this.token,
    required this.type,
    required this.id,
    required this.fullName,
    required this.email,
    this.phone,
    required this.role,
    this.createdAt,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) => AuthResponse(
        token: json['token'] as String,
        type: json['type'] as String? ?? 'Bearer',
        id: (json['id'] as num).toInt(),
        fullName: json['fullName'] as String,
        email: json['email'] as String,
        phone: json['phone'] as String?,
        role: json['role'] as String,
        createdAt: json['createdAt'] != null
            ? DateTime.parse(json['createdAt'] as String)
            : null,
      );
}
