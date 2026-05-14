import 'package:dio/dio.dart';
import 'package:latlong2/latlong.dart';
import '../models/navigation_route.dart';
import '../utils/constants.dart';
import 'dio_client.dart';

class NavigationService {
  final _dio = DioClient().dio;
  final _mapboxDio = Dio();

  /// Try backend first, fall back to Mapbox Directions API
  Future<NavigationRoute> getRoute({
    required double userLat,
    required double userLng,
    required double parkingLat,
    required double parkingLng,
  }) async {
    // Try Mapbox Directions API (richer data with steps)
    try {
      return await _getMapboxRoute(
        userLat: userLat,
        userLng: userLng,
        parkingLat: parkingLat,
        parkingLng: parkingLng,
      );
    } catch (_) {}

    // Fallback to backend
    try {
      return await _getBackendRoute(
        userLat: userLat,
        userLng: userLng,
        parkingLat: parkingLat,
        parkingLng: parkingLng,
      );
    } catch (_) {}

    // Last resort: direct line
    return NavigationRoute(
      points: [
        LatLng(userLat, userLng),
        LatLng(parkingLat, parkingLng),
      ],
      distance: NavigationRoute.formatDistance(
        const Distance().as(LengthUnit.Meter, LatLng(userLat, userLng),
            LatLng(parkingLat, parkingLng)),
      ),
      duration: '',
      distanceMeters: const Distance().as(
        LengthUnit.Meter,
        LatLng(userLat, userLng),
        LatLng(parkingLat, parkingLng),
      ),
    );
  }

  Future<NavigationRoute> _getMapboxRoute({
    required double userLat,
    required double userLng,
    required double parkingLat,
    required double parkingLng,
  }) async {
    final url =
        'https://api.mapbox.com/directions/v5/mapbox/driving/$userLng,$userLat;$parkingLng,$parkingLat'
        '?geometries=geojson&overview=full&steps=true&banner_instructions=true'
        '&access_token=${AppConstants.mapboxAccessToken}';

    final response = await _mapboxDio.get(url);
    return NavigationRoute.fromMapboxJson(response.data as Map<String, dynamic>);
  }

  Future<NavigationRoute> _getBackendRoute({
    required double userLat,
    required double userLng,
    required double parkingLat,
    required double parkingLng,
  }) async {
    final response = await _dio.get(
      ApiConstants.navigationRoute(userLat, userLng, parkingLat, parkingLng),
    );

    final data = response.data;
    final payload = data is Map && data.containsKey('data') ? data['data'] : data;
    return NavigationRoute.fromBackendJson(payload as Map<String, dynamic>);
  }

  /// Check if user deviated from route (> threshold meters from nearest point)
  static bool hasDeviated(LatLng userPos, List<LatLng> routePoints,
      {double thresholdMeters = 50}) {
    if (routePoints.isEmpty) return false;
    const dist = Distance();
    for (final p in routePoints) {
      if (dist.as(LengthUnit.Meter, userPos, p) < thresholdMeters) {
        return false;
      }
    }
    return true;
  }

  /// Find the closest point index on the route to the user
  static int closestPointIndex(LatLng userPos, List<LatLng> routePoints) {
    if (routePoints.isEmpty) return 0;
    const dist = Distance();
    double minDist = double.infinity;
    int minIdx = 0;
    for (int i = 0; i < routePoints.length; i++) {
      final d = dist.as(LengthUnit.Meter, userPos, routePoints[i]);
      if (d < minDist) {
        minDist = d;
        minIdx = i;
      }
    }
    return minIdx;
  }

  /// Calculate remaining distance from a point index
  static double remainingDistance(List<LatLng> routePoints, int fromIndex) {
    if (routePoints.isEmpty || fromIndex >= routePoints.length - 1) return 0;
    const dist = Distance();
    double total = 0;
    for (int i = fromIndex; i < routePoints.length - 1; i++) {
      total += dist.as(LengthUnit.Meter, routePoints[i], routePoints[i + 1]);
    }
    return total;
  }
}
