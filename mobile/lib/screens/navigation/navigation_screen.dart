import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';

import '../../models/parking.dart';
import '../../providers/navigation_provider.dart';
import '../../utils/constants.dart';
import '../../utils/theme.dart';
import '../../widgets/navigation/animated_user_marker.dart';
import '../../widgets/navigation/navigation_bottom_panel.dart';
import '../../widgets/navigation/parking_destination_marker.dart';

class NavigationScreen extends StatefulWidget {
  final Parking parking;

  const NavigationScreen({super.key, required this.parking});

  @override
  State<NavigationScreen> createState() => _NavigationScreenState();
}

class _NavigationScreenState extends State<NavigationScreen>
    with TickerProviderStateMixin {
  final MapController _mapController = MapController();
  bool _isFollowing = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NavigationProvider>().startNavigation(widget.parking);
    });
  }

  void _centerOnUser(NavigationProvider nav) {
    if (nav.userPosition != null) {
      _mapController.move(nav.userPosition!, 17);
      setState(() => _isFollowing = true);
    }
  }

  void _fitRoute(NavigationProvider nav) {
    if (nav.route == null || nav.route!.points.isEmpty) return;
    final points = nav.route!.points;
    double minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    for (final p in points) {
      if (p.latitude < minLat) minLat = p.latitude;
      if (p.latitude > maxLat) maxLat = p.latitude;
      if (p.longitude < minLng) minLng = p.longitude;
      if (p.longitude > maxLng) maxLng = p.longitude;
    }
    _mapController.fitCamera(
      CameraFit.bounds(
        bounds: LatLngBounds(LatLng(minLat, minLng), LatLng(maxLat, maxLng)),
        padding: const EdgeInsets.fromLTRB(60, 120, 60, 300),
      ),
    );
  }

  @override
  void dispose() {
    _mapController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<NavigationProvider>(
      builder: (context, nav, _) {
        // Auto-follow user
        if (_isFollowing && nav.userPosition != null && nav.state == NavState.navigating) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _mapController.move(nav.userPosition!, _mapController.camera.zoom);
          });
        }

        return Scaffold(
          body: Stack(
            children: [
              // ── Map ──
              _buildMap(nav),

              // ── Top bar ──
              _buildTopBar(nav),

              // ── Loading overlay ──
              if (nav.state == NavState.loading)
                Container(
                  color: Colors.white.withAlpha(200),
                  child: const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CircularProgressIndicator(
                          color: AppTheme.primaryColor,
                        ),
                        SizedBox(height: 16),
                        Text(
                          'Calculating route...',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

              // ── Error overlay ──
              if (nav.state == NavState.error)
                _buildErrorOverlay(nav),

              // ── Arrived overlay ──
              if (nav.state == NavState.arrived)
                _buildArrivedOverlay(nav),

              // ── Bottom panel ──
              if (nav.state == NavState.navigating)
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  child: NavigationBottomPanel(
                    parkingName: nav.destination?.name ?? '',
                    remainingDistance: nav.remainingDistanceText,
                    remainingDuration: nav.remainingDurationText,
                    eta: nav.etaText,
                    speedText: nav.speedText,
                    currentStep: nav.currentStep,
                    nextStep: nav.nextStep,
                    voiceEnabled: nav.voiceEnabled,
                    onToggleVoice: nav.toggleVoice,
                    onCancel: () {
                      nav.stopNavigation();
                      Navigator.pop(context);
                    },
                  ),
                ),

              // ── Re-center button ──
              if (nav.state == NavState.navigating && !_isFollowing)
                Positioned(
                  right: 16,
                  bottom: 320,
                  child: FloatingActionButton.small(
                    heroTag: 'recenter',
                    backgroundColor: Colors.white,
                    onPressed: () => _centerOnUser(nav),
                    child: const Icon(Icons.my_location,
                        color: AppTheme.primaryColor, size: 22),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildMap(NavigationProvider nav) {
    final destLatLng = widget.parking.hasLocation
        ? LatLng(widget.parking.latitude!, widget.parking.longitude!)
        : LatLng(AppConstants.defaultLat, AppConstants.defaultLng);

    final tileUrl = nav.nightMode
        ? 'https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1/tiles/{z}/{x}/{y}@2x?access_token=${AppConstants.mapboxAccessToken}&worldview=MA'
        : AppConstants.mapboxStyleUrl;

    // Split route into completed and remaining
    List<Polyline> routePolylines = [];
    if (nav.route != null && nav.route!.points.isNotEmpty) {
      final pts = nav.route!.points;
      final splitIdx = nav.progressIndex.clamp(0, pts.length - 1);

      // Completed part (gray)
      if (splitIdx > 0) {
        routePolylines.add(Polyline(
          points: pts.sublist(0, splitIdx + 1),
          color: Colors.grey.shade400,
          strokeWidth: 5,
        ));
      }

      // Remaining part (blue glow + main)
      if (splitIdx < pts.length - 1) {
        routePolylines.add(Polyline(
          points: pts.sublist(splitIdx),
          color: AppTheme.primaryColor.withAlpha(60),
          strokeWidth: 10,
        ));
        routePolylines.add(Polyline(
          points: pts.sublist(splitIdx),
          color: AppTheme.primaryColor,
          strokeWidth: 5,
        ));
      }
    }

    return FlutterMap(
      mapController: _mapController,
      options: MapOptions(
        initialCenter:
            nav.userPosition ?? LatLng(AppConstants.defaultLat, AppConstants.defaultLng),
        initialZoom: 16,
        onPositionChanged: (pos, hasGesture) {
          if (hasGesture) setState(() => _isFollowing = false);
        },
      ),
      children: [
        // Tile layer (day/night)
        TileLayer(
          urlTemplate: tileUrl,
          userAgentPackageName: 'com.example.mobile',
          maxZoom: 19,
          tileDimension: 512,
          zoomOffset: -1,
        ),

        // Route polylines (completed gray + remaining blue)
        if (routePolylines.isNotEmpty)
          PolylineLayer(polylines: routePolylines),

        // Next turn highlight
        if (nav.currentStep != null)
          MarkerLayer(
            markers: [
              Marker(
                point: nav.currentStep!.location,
                width: 24,
                height: 24,
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppTheme.primaryColor, width: 3),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primaryColor.withAlpha(60),
                        blurRadius: 8,
                      ),
                    ],
                  ),
                  child: const Icon(Icons.circle, size: 8,
                      color: AppTheme.primaryColor),
                ),
              ),
            ],
          ),

        // Markers
        MarkerLayer(
          markers: [
            // Destination marker
            Marker(
              point: destLatLng,
              width: 100,
              height: 60,
              child: ParkingDestinationMarker(
                label: widget.parking.name,
              ),
            ),
            // User marker
            if (nav.userPosition != null)
              Marker(
                point: nav.userPosition!,
                width: 56,
                height: 56,
                child: AnimatedUserMarker(heading: nav.userHeading),
              ),
          ],
        ),
      ],
    );
  }

  Widget _buildTopBar(NavigationProvider nav) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
        child: Row(
          children: [
            // Back button
            Material(
              color: Colors.white,
              elevation: 3,
              shadowColor: Colors.black26,
              shape: const CircleBorder(),
              child: InkWell(
                onTap: () {
                  nav.stopNavigation();
                  Navigator.pop(context);
                },
                customBorder: const CircleBorder(),
                child: const Padding(
                  padding: EdgeInsets.all(12),
                  child: Icon(Icons.arrow_back_ios_new,
                      size: 20, color: AppTheme.textPrimary),
                ),
              ),
            ),
            const Spacer(),
            // Speed display
            if (nav.state == NavState.navigating)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withAlpha(40),
                      blurRadius: 8,
                    ),
                  ],
                ),
                child: Text(
                  nav.speedText,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ),
            const SizedBox(width: 8),
            // Night mode button
            if (nav.state == NavState.navigating)
              Material(
                color: nav.nightMode ? const Color(0xFF1E1B4B) : Colors.white,
                elevation: 3,
                shadowColor: Colors.black26,
                shape: const CircleBorder(),
                child: InkWell(
                  onTap: () => nav.toggleNightMode(),
                  customBorder: const CircleBorder(),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Icon(
                      nav.nightMode ? Icons.dark_mode : Icons.light_mode,
                      size: 20,
                      color: nav.nightMode ? Colors.white : AppTheme.textPrimary,
                    ),
                  ),
                ),
              ),
            const SizedBox(width: 8),
            // Fit route button
            if (nav.state == NavState.navigating)
              Material(
                color: Colors.white,
                elevation: 3,
                shadowColor: Colors.black26,
                shape: const CircleBorder(),
                child: InkWell(
                  onTap: () => _fitRoute(nav),
                  customBorder: const CircleBorder(),
                  child: const Padding(
                    padding: EdgeInsets.all(12),
                    child: Icon(Icons.zoom_out_map,
                        size: 20, color: AppTheme.textPrimary),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorOverlay(NavigationProvider nav) {
    return Container(
      color: Colors.white.withAlpha(230),
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline,
                  size: 60, color: AppTheme.errorColor),
              const SizedBox(height: 16),
              Text(
                nav.errorMessage ?? 'Navigation error',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  OutlinedButton(
                    onPressed: () {
                      nav.stopNavigation();
                      Navigator.pop(context);
                    },
                    child: const Text('Go Back'),
                  ),
                  const SizedBox(width: 12),
                  ElevatedButton(
                    onPressed: () => nav.startNavigation(widget.parking),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildArrivedOverlay(NavigationProvider nav) {
    return Positioned(
      left: 0,
      right: 0,
      bottom: 0,
      child: AnimatedSlide(
        offset: Offset.zero,
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeOut,
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius:
                const BorderRadius.vertical(top: Radius.circular(24)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(30),
                blurRadius: 20,
                offset: const Offset(0, -5),
              ),
            ],
          ),
          child: SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      color: AppTheme.accentColor.withAlpha(25),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.check_circle,
                        color: AppTheme.accentColor, size: 36),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'You have arrived!',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    widget.parking.name,
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: () {
                        nav.stopNavigation();
                        Navigator.pop(context);
                      },
                      style: ElevatedButton.styleFrom(
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: const Text(
                        'Done',
                        style: TextStyle(
                            fontSize: 16, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
