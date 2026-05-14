import 'package:latlong2/latlong.dart';

class NavigationRoute {
  final List<LatLng> points;
  final String distance;
  final String duration;
  final double distanceMeters;
  final double durationSeconds;
  final List<NavigationStep> steps;

  NavigationRoute({
    required this.points,
    required this.distance,
    required this.duration,
    this.distanceMeters = 0,
    this.durationSeconds = 0,
    this.steps = const [],
  });

  factory NavigationRoute.fromBackendJson(Map<String, dynamic> json) {
    final routeList = json['route'] as List? ?? [];
    final points = routeList
        .map((p) => LatLng(
              (p['lat'] as num).toDouble(),
              (p['lng'] as num).toDouble(),
            ))
        .toList();

    return NavigationRoute(
      points: points,
      distance: json['distance'] as String? ?? '',
      duration: json['duration'] as String? ?? '',
    );
  }

  factory NavigationRoute.fromMapboxJson(Map<String, dynamic> json) {
    final routes = json['routes'] as List?;
    if (routes == null || routes.isEmpty) {
      return NavigationRoute(points: [], distance: '', duration: '');
    }

    final route = routes[0] as Map<String, dynamic>;
    final geometry = route['geometry'] as Map<String, dynamic>;
    final coords = geometry['coordinates'] as List;
    final points = coords
        .map((c) => LatLng((c[1] as num).toDouble(), (c[0] as num).toDouble()))
        .toList();

    final distMeters = (route['distance'] as num?)?.toDouble() ?? 0;
    final durSeconds = (route['duration'] as num?)?.toDouble() ?? 0;

    // Parse steps
    final legs = route['legs'] as List? ?? [];
    final steps = <NavigationStep>[];
    for (final leg in legs) {
      final legSteps = (leg as Map<String, dynamic>)['steps'] as List? ?? [];
      for (final s in legSteps) {
        final step = s as Map<String, dynamic>;
        final maneuver = step['maneuver'] as Map<String, dynamic>? ?? {};
        final loc = maneuver['location'] as List? ?? [0, 0];
        steps.add(NavigationStep(
          instruction: maneuver['instruction'] as String? ?? '',
          type: maneuver['type'] as String? ?? '',
          modifier: maneuver['modifier'] as String? ?? '',
          distance: (step['distance'] as num?)?.toDouble() ?? 0,
          duration: (step['duration'] as num?)?.toDouble() ?? 0,
          location: LatLng(
            (loc[1] as num).toDouble(),
            (loc[0] as num).toDouble(),
          ),
        ));
      }
    }

    return NavigationRoute(
      points: points,
      distance: formatDistance(distMeters),
      duration: formatDuration(durSeconds),
      distanceMeters: distMeters,
      durationSeconds: durSeconds,
      steps: steps,
    );
  }

  static String formatDistance(double meters) {
    if (meters < 1000) return '${meters.round()} m';
    return '${(meters / 1000).toStringAsFixed(1)} km';
  }

  static String formatDuration(double seconds) {
    final mins = (seconds / 60).round();
    if (mins < 60) return '$mins min';
    final h = mins ~/ 60;
    final m = mins % 60;
    return m > 0 ? '${h}h ${m}min' : '${h}h';
  }
}

class NavigationStep {
  final String instruction;
  final String type;
  final String modifier;
  final double distance;
  final double duration;
  final LatLng location;

  NavigationStep({
    required this.instruction,
    required this.type,
    required this.modifier,
    required this.distance,
    required this.duration,
    required this.location,
  });

  String get voiceInstruction {
    if (instruction.isNotEmpty) return instruction;
    switch (type) {
      case 'turn':
        return modifier == 'left' ? 'Turn left' : 'Turn right';
      case 'depart':
        return 'Head $modifier';
      case 'arrive':
        return 'You have arrived at your destination';
      case 'continue':
        return 'Continue straight';
      case 'merge':
        return 'Merge $modifier';
      case 'roundabout':
        return 'Enter the roundabout';
      default:
        return 'Continue on the route';
    }
  }
}
