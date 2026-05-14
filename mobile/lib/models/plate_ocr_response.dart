class PlateOcrResponse {
  final String? plate;
  final double confidence;
  final String message;

  PlateOcrResponse({
    required this.plate,
    required this.confidence,
    required this.message,
  });

  factory PlateOcrResponse.fromJson(Map<String, dynamic> json) {
    return PlateOcrResponse(
      plate: json['plate'] as String?,
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.0,
      message: json['message'] as String? ?? '',
    );
  }
}

