import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/parking.dart';
import '../../models/parking_slot.dart';
import '../../providers/parking_provider.dart';
import '../../utils/theme.dart';
import '../../utils/helpers.dart';
import '../../widgets/blueprint_view.dart';
import '../../widgets/floor_tab_bar.dart';
import '../../models/reservation.dart';
import '../../widgets/reservation_bottom_sheet.dart';
import '../reservations/reservation_qr_screen.dart';

/// Full-screen professional 2D blueprint view of a parking lot.
/// Navigated to from ParkingDetailScreen via "Blueprint View" button.
class ParkingBlueprintScreen extends StatefulWidget {
  final Parking parking;

  const ParkingBlueprintScreen({super.key, required this.parking});

  @override
  State<ParkingBlueprintScreen> createState() =>
      _ParkingBlueprintScreenState();
}

class _ParkingBlueprintScreenState extends State<ParkingBlueprintScreen> {
  ParkingSlot? _selectedSlot;
  String? _activeFloor;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ParkingProvider>().loadAllSlots(widget.parking.id);
    });
  }

  void _openReservation(ParkingSlot slot) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ReservationBottomSheet(
        parking: widget.parking,
        slot: slot,
      ),
    ).then((result) {
      if (!mounted) return;
      if (result is Reservation) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ReservationQrScreen(reservationId: result.id),
          ),
        );
      }
      if (result != null) {
        context.read<ParkingProvider>().loadAllSlots(widget.parking.id);
        setState(() => _selectedSlot = null);
      }
    });
  }

  List<String> _getFloors(List<ParkingSlot> slots) {
    final floors = slots.map((s) => s.floor ?? 'Ground').toSet().toList();
    floors.sort();
    return floors;
  }

  List<ParkingSlot> _filterByFloor(List<ParkingSlot> slots, String floor) {
    return slots.where((s) => (s.floor ?? 'Ground') == floor).toList();
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.parking;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(p.name, style: const TextStyle(fontSize: 16)),
            Text(
              '${Helpers.formatPrice(p.pricePerHour)}/h · ${p.totalSlots} slots',
              style: TextStyle(
                fontSize: 11,
                color: Colors.grey.shade500,
                fontWeight: FontWeight.w400,
              ),
            ),
          ],
        ),
        actions: [
          // Zoom reset hint
          IconButton(
            icon: const Icon(Icons.zoom_out_map, size: 20),
            tooltip: 'Pinch to zoom',
            onPressed: () {},
          ),
        ],
      ),
      body: Consumer<ParkingProvider>(
        builder: (context, prov, _) {
          final allSlots = prov.slots;
          final floors = _getFloors(allSlots);

          // Set initial floor
          if (_activeFloor == null && floors.isNotEmpty) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted) setState(() => _activeFloor = floors.first);
            });
          }

          final currentFloor = _activeFloor ?? (floors.isNotEmpty ? floors.first : 'Ground');
          final floorSlots = _filterByFloor(allSlots, currentFloor);

          // Stats
          final available =
              floorSlots.where((s) => s.status == 'AVAILABLE').length;

          return Column(
            children: [
              // Stats bar
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                color: Colors.white,
                child: Row(
                  children: [
                    _statChip(Icons.layers, 'Floor', currentFloor,
                        AppTheme.primaryColor),
                    const SizedBox(width: 10),
                    _statChip(Icons.check_circle_outline, 'Available',
                        '$available', AppTheme.availableColor),
                    const SizedBox(width: 10),
                    _statChip(Icons.grid_view, 'Total',
                        '${floorSlots.length}', Colors.grey),
                  ],
                ),
              ),

              // Floor tabs
              if (floors.length > 1)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: FloorTabBar(
                    floors: floors,
                    activeFloor: currentFloor,
                    onFloorChanged: (floor) {
                      setState(() {
                        _activeFloor = floor;
                        _selectedSlot = null;
                      });
                    },
                  ),
                ),

              // Blueprint view
              Expanded(
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 300),
                  switchInCurve: Curves.easeOut,
                  switchOutCurve: Curves.easeIn,
                  transitionBuilder: (child, animation) {
                    return FadeTransition(
                      opacity: animation,
                      child: SlideTransition(
                        position: Tween<Offset>(
                          begin: const Offset(0.15, 0),
                          end: Offset.zero,
                        ).animate(animation),
                        child: child,
                      ),
                    );
                  },
                  child: SingleChildScrollView(
                    key: ValueKey(currentFloor),
                    padding: const EdgeInsets.all(12),
                    child: BlueprintView(
                      slots: floorSlots,
                      isLoading: prov.isSlotsLoading,
                      selectedSlot: _selectedSlot,
                      onSlotTap: (slot) {
                        setState(() {
                          _selectedSlot =
                              _selectedSlot?.id == slot.id ? null : slot;
                        });
                      },
                      pricePerHour: p.pricePerHour,
                    ),
                  ),
                ),
              ),

              // Selected slot bar
              if (_selectedSlot != null) _selectedSlotBar(),
            ],
          );
        },
      ),
    );
  }

  Widget _statChip(IconData icon, String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: color.withAlpha(15),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 18),
            const SizedBox(height: 4),
            Text(
              value,
              style: TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 14,
                color: color,
              ),
            ),
            Text(
              label,
              style: const TextStyle(
                fontSize: 9,
                color: AppTheme.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _selectedSlotBar() {
    final slot = _selectedSlot!;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey.shade200)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(8),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withAlpha(20),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.check_circle,
                  color: AppTheme.primaryColor, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Slot ${slot.slotNumber}',
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                    ),
                  ),
                  Text(
                    '${slot.slotType}${slot.floor != null ? ' · Floor ${slot.floor}' : ''}'
                    '${widget.parking.pricePerHour > 0 ? ' · ${Helpers.formatPrice(widget.parking.pricePerHour)}/h' : ''}',
                    style: const TextStyle(
                      color: AppTheme.textSecondary,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            ElevatedButton(
              onPressed: () => _openReservation(slot),
              style: ElevatedButton.styleFrom(
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text('Book Now'),
            ),
          ],
        ),
      ),
    );
  }
}

