import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';

import '../../models/parking.dart';
import '../../providers/parking_provider.dart';
import '../../utils/constants.dart';
import '../../utils/theme.dart';
import '../../widgets/app_drawer.dart';
import '../../widgets/parking_bottom_sheet.dart';
import '../../widgets/map_filter_chips.dart';
import '../parking/parking_detail_screen.dart';
import '../navigation/navigation_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final MapController _mapController = MapController();
  final _scaffoldKey = GlobalKey<ScaffoldState>();

  Timer? _searchDebounce;
  final _searchCtrl = TextEditingController();
  MapFilters _filters = const MapFilters();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _init());
  }

  Future<void> _init() async {
    final provider = context.read<ParkingProvider>();
    await provider.initLocation();
    await provider.loadParkings();
  }

  void _onMarkerTapped(Parking parking) {
    context.read<ParkingProvider>().selectParking(parking);
    _mapController.move(
      LatLng(parking.latitude!, parking.longitude!),
      AppConstants.markerZoom,
    );
    _showParkingPopup(parking);
  }

  void _onParkingSelected(Parking parking) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => ParkingDetailScreen(parking: parking)),
    ).then((_) {
      if (!mounted) return;
      context.read<ParkingProvider>().loadParkings();
    });
  }

  void _showParkingPopup(Parking parking) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        margin: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: const [
            BoxShadow(color: Colors.black26, blurRadius: 12, offset: Offset(0, 4)),
          ],
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Parking name & status
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withAlpha(25),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.local_parking,
                      color: AppTheme.primaryColor, size: 28),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        parking.name,
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textPrimary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        parking.address,
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppTheme.textSecondary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Info chips
            Row(
              children: [
                _infoChip(
                  icon: Icons.event_seat,
                  label: '${parking.availableSlots}/${parking.totalSlots}',
                  color: parking.availableSlots > 0
                      ? AppTheme.availableColor
                      : AppTheme.occupiedColor,
                ),
                const SizedBox(width: 10),
                _infoChip(
                  icon: Icons.attach_money,
                  label: '${parking.pricePerHour.toStringAsFixed(1)} DH/h',
                  color: AppTheme.primaryColor,
                ),
                if (parking.distance != null) ...[
                  const SizedBox(width: 10),
                  _infoChip(
                    icon: Icons.near_me,
                    label: parking.distance! < 1
                        ? '${(parking.distance! * 1000).toInt()} m'
                        : '${parking.distance!.toStringAsFixed(1)} km',
                    color: AppTheme.textSecondary,
                  ),
                ],
              ],
            ),
            const SizedBox(height: 20),

            // Action buttons
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                      _onParkingSelected(parking);
                    },
                    icon: const Icon(Icons.book_online, size: 20),
                    label: const Text('Reserve'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                      textStyle: const TextStyle(
                          fontWeight: FontWeight.w600, fontSize: 15),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: parking.hasLocation
                        ? () {
                            Navigator.pop(context);
                            _navigateToParking(parking);
                          }
                        : null,
                    icon: const Icon(Icons.directions, size: 20),
                    label: const Text('Directions'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blueAccent,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                      textStyle: const TextStyle(
                          fontWeight: FontWeight.w600, fontSize: 15),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoChip({
    required IconData icon,
    required String label,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withAlpha(20),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 4),
          Text(label,
              style: TextStyle(
                  fontSize: 12, fontWeight: FontWeight.w600, color: color)),
        ],
      ),
    );
  }

  List<Parking> _filteredParkings(ParkingProvider provider) {
    var list = provider.nearbyParkings;
    if (_filters.availableOnly) {
      list = list.where((p) => p.availableSlots > 0).toList();
    }
    if (_filters.maxDistance < 100) {
      list = list
          .where((p) => (p.distance ?? 999) <= _filters.maxDistance)
          .toList();
    }
    // Infer parking type from description
    if (_filters.parkingType != 'all') {
      list = list.where((p) {
        final desc = (p.description ?? '').toLowerCase();
        switch (_filters.parkingType) {
          case 'Covered':
            return desc.contains('covered') || desc.contains('underground');
          case 'Outdoor':
            return desc.contains('outdoor') || desc.contains('open-air') || desc.contains('street');
          case 'EV Charging':
            return desc.contains('ev') || desc.contains('electric') || desc.contains('charging');
          default:
            return true;
        }
      }).toList();
    }
    return list;
  }

  void _navigateToParking(Parking parking) {
    if (!parking.hasLocation) return;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => NavigationScreen(parking: parking),
      ),
    );
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _searchCtrl.dispose();
    _mapController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      drawer: const AppDrawer(),
      body: Consumer<ParkingProvider>(
        builder: (context, provider, _) {
          final lat =
              provider.userLocation?.latitude ?? AppConstants.defaultLat;
          final lng =
              provider.userLocation?.longitude ?? AppConstants.defaultLng;

          return Stack(
            children: [
              // ── Mapbox Map ──
              FlutterMap(
                mapController: _mapController,
                options: MapOptions(
                  initialCenter: LatLng(lat, lng),
                  initialZoom: AppConstants.defaultZoom,
                ),
                children: [
                  TileLayer(
                    urlTemplate: AppConstants.mapboxStyleUrl,
                    userAgentPackageName: 'app.parkingo.mobile',
                    maxZoom: 19,
                    tileDimension: 512,
                    zoomOffset: -1,
                  ),

                  // Polyline layer removed — navigation is a dedicated screen

                  // Markers layer
                  MarkerLayer(
                    markers: _buildMarkers(provider, _filteredParkings(provider)),
                  ),
                ],
              ),

              // ── Top controls ──
              SafeArea(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                      child: Row(
                        children: [
                          _circleBtn(
                            icon: Icons.menu,
                            onTap: () =>
                                _scaffoldKey.currentState?.openDrawer(),
                          ),
                          const SizedBox(width: 10),
                          Expanded(child: _searchBar(provider)),
                          const SizedBox(width: 10),
                          _circleBtn(
                            icon: Icons.my_location,
                            onTap: () {
                              if (provider.userLocation != null) {
                                _mapController.move(
                                  LatLng(
                                    provider.userLocation!.latitude,
                                    provider.userLocation!.longitude,
                                  ),
                                  AppConstants.defaultZoom,
                                );
                              }
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),
                    // ── Filter chips ──
                    MapFilterChips(
                      onFiltersChanged: (f) {
                        setState(() => _filters = f);
                      },
                    ),
                  ],
                ),
              ),

              // ── Bottom sheet ──
              ParkingBottomSheet(
                  parkings: _filteredParkings(provider),
                  isLoading: provider.isLoading,
                  userLocation: provider.userLocation,
                  onParkingTap: _onParkingSelected,
                  onParkingLocate: (p) {
                    if (p.hasLocation) {
                      _onMarkerTapped(p);
                      _navigateToParking(p);
                    }
                  },
                ),
            ],
          );
        },
      ),
    );
  }

  List<Marker> _buildMarkers(ParkingProvider provider, List<Parking> filteredParkings) {
    final markers = <Marker>[];

    // User location marker
    if (provider.userLocation != null) {
      markers.add(
        Marker(
          point: LatLng(
            provider.userLocation!.latitude,
            provider.userLocation!.longitude,
          ),
          width: 30,
          height: 30,
          child: Container(
            decoration: BoxDecoration(
              color: AppTheme.primaryColor,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 3),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.primaryColor.withAlpha(80),
                  blurRadius: 10,
                  spreadRadius: 3,
                ),
              ],
            ),
          ),
        ),
      );
    }

    // Parking markers (use filtered list)
    for (var p in filteredParkings) {
      if (!p.hasLocation) continue;
      markers.add(
        Marker(
          point: LatLng(p.latitude!, p.longitude!),
          width: 40,
          height: 50,
          child: GestureDetector(
            onTap: () => _onMarkerTapped(p),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    boxShadow: const [
                      BoxShadow(color: Colors.black26, blurRadius: 4),
                    ],
                  ),
                  child: Text(
                    '${p.availableSlots}',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: p.availableSlots > 0
                          ? AppTheme.availableColor
                          : AppTheme.occupiedColor,
                    ),
                  ),
                ),
                Icon(
                  Icons.location_on,
                  size: 30,
                  color: p.availableSlots > 0
                      ? AppTheme.availableColor
                      : AppTheme.occupiedColor,
                ),
              ],
            ),
          ),
        ),
      );
    }

    return markers;
  }

  Widget _circleBtn({required IconData icon, required VoidCallback onTap}) {
    return Material(
      color: Colors.white,
      elevation: 3,
      shadowColor: Colors.black26,
      shape: const CircleBorder(),
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Icon(icon, size: 22, color: AppTheme.textPrimary),
        ),
      ),
    );
  }

  Widget _searchBar(ParkingProvider provider) {
    return Material(
      elevation: 3,
      shadowColor: Colors.black26,
      borderRadius: BorderRadius.circular(28),
      child: TextField(
        controller: _searchCtrl,
        decoration: InputDecoration(
          hintText: 'Search parking...',
          prefixIcon:
              const Icon(Icons.search, color: AppTheme.textSecondary),
          suffixIcon: _searchCtrl.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear, size: 20),
                  onPressed: () {
                    _searchCtrl.clear();
                    provider.loadParkings();
                    setState(() {});
                  },
                )
              : null,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(28),
            borderSide: BorderSide.none,
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(28),
            borderSide: BorderSide.none,
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(28),
            borderSide: BorderSide.none,
          ),
          filled: true,
          fillColor: Colors.white,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        ),
        onChanged: (value) {
          _searchDebounce?.cancel();
          _searchDebounce = Timer(const Duration(milliseconds: 500), () {
            provider.searchParkings(value);
          });
          setState(() {});
        },
      ),
    );
  }
}
