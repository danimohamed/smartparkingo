/// Summary row from GET /api/chats
class GuardChatSummary {
  final int id;
  final int parkingId;
  final String parkingName;
  final int peerUserId;
  final String peerFullName;
  final String peerRole;
  final String? guardPhone;
  final DateTime? updatedAt;

  GuardChatSummary({
    required this.id,
    required this.parkingId,
    required this.parkingName,
    required this.peerUserId,
    required this.peerFullName,
    required this.peerRole,
    this.guardPhone,
    this.updatedAt,
  });

  factory GuardChatSummary.fromJson(Map<String, dynamic> json) {
    return GuardChatSummary(
      id: (json['id'] as num).toInt(),
      parkingId: (json['parkingId'] as num).toInt(),
      parkingName: json['parkingName'] as String? ?? '',
      peerUserId: (json['peerUserId'] as num).toInt(),
      peerFullName: json['peerFullName'] as String? ?? '',
      peerRole: json['peerRole'] as String? ?? '',
      guardPhone: json['guardPhone'] as String?,
      updatedAt: _parseDate(json['updatedAt']),
    );
  }
}

/// Message from GET /api/chats/{id}/messages
class GuardChatMessage {
  final int id;
  final int? senderUserId;
  final String? senderFullName;
  final String body;
  final bool systemMessage;
  final bool fromMe;
  final DateTime? createdAt;

  GuardChatMessage({
    required this.id,
    this.senderUserId,
    this.senderFullName,
    required this.body,
    required this.systemMessage,
    required this.fromMe,
    this.createdAt,
  });

  factory GuardChatMessage.fromJson(Map<String, dynamic> json) {
    return GuardChatMessage(
      id: (json['id'] as num).toInt(),
      senderUserId: json['senderUserId'] != null
          ? (json['senderUserId'] as num).toInt()
          : null,
      senderFullName: json['senderFullName'] as String?,
      body: json['body'] as String? ?? '',
      systemMessage: json['systemMessage'] as bool? ?? false,
      fromMe: json['fromMe'] as bool? ?? false,
      createdAt: _parseDate(json['createdAt']),
    );
  }
}

DateTime? _parseDate(dynamic v) {
  if (v == null) return null;
  if (v is String) {
    try {
      return DateTime.parse(v);
    } catch (_) {
      return null;
    }
  }
  return null;
}
