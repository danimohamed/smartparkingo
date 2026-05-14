/// Shared helpers for unwrapping the Spring Boot `ApiResponse<T>` envelope:
///
/// ```json
/// { "success": true, "message": "...", "data": <T>, "timestamp": "..." }
/// ```
///
/// Some endpoints (notably `WalletController`) return raw `Map<String,Object>`
/// — the helpers below tolerate both shapes so services can call them
/// uniformly.
mixin ApiResponseParser {
  /// Returns `data['data']` when the response is wrapped in an
  /// [ApiResponse]-style envelope, else returns the value as-is.
  Map<String, dynamic> extractObject(dynamic data) {
    if (data is Map<String, dynamic> && data.containsKey('data')) {
      final inner = data['data'];
      if (inner is Map<String, dynamic>) return inner;
    }
    if (data is Map<String, dynamic>) return data;
    return <String, dynamic>{};
  }

  /// Returns the array under `data['data']` when present, or [data] itself
  /// when it is already a list. Falls back to `[]` for unexpected shapes.
  List<dynamic> extractList(dynamic data) {
    if (data is Map && data.containsKey('data')) {
      final inner = data['data'];
      if (inner is List) return inner;
    }
    if (data is List) return data;
    return const [];
  }
}

