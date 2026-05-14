import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/parking.dart';
import '../../models/parking_slot.dart';
import '../../providers/parking_provider.dart';
import '../../utils/theme.dart';
import '../../utils/helpers.dart';
import '../../widgets/slot_grid.dart';
import '../../widgets/reservation_bottom_sheet.dart';
import '../../models/reservation.dart';
import '../navigation/navigation_screen.dart';
import '../reservations/reservation_qr_screen.dart';
import 'parking_blueprint_screen.dart';

class ParkingDetailScreen extends StatefulWidget {
  final Parking parking;

  const ParkingDetailScreen({super.key, required this.parking});

  @override
  State<ParkingDetailScreen> createState() => _ParkingDetailScreenState();
}

class _ParkingDetailScreenState extends State<ParkingDetailScreen> {
  ParkingSlot? _selectedSlot;

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

  void _openNavigation() {
    final p = widget.parking;
    if (!p.hasLocation) return;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => NavigationScreen(parking: p),
      ),
    );
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
        title: Text(p.name),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Info header ──
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              color: Colors.white,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Address
                  Row(
                    children: [
                      const Icon(Icons.location_on,
                          size: 18, color: AppTheme.primaryColor),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          p.address,
                          style: const TextStyle(
                            color: AppTheme.textSecondary,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ],
                  ),
                  if ((p.guardName ?? '').isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        const Icon(Icons.shield_outlined,
                            size: 18, color: AppTheme.textSecondary),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Guard: ${p.guardName}${(p.guardPhone ?? '').isNotEmpty ? ' • ${p.guardPhone}' : ''}',
                            style: const TextStyle(
                              color: AppTheme.textSecondary,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                  if (p.description != null && p.description!.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Text(
                      p.description!,
                      style: const TextStyle(
                          color: AppTheme.textSecondary, fontSize: 13),
                    ),
                  ],
                  const SizedBox(height: 20),

                  // Stats row
                  Row(
                    children: [
                      _stat(
                        icon: Icons.local_parking,
                        label: 'Total',
                        value: '${p.totalSlots}',
                        color: AppTheme.primaryColor,
                      ),
                      _stat(
                        icon: Icons.check_circle_outline,
                        label: 'Available',
                        value: '${p.availableSlots}',
                        color: AppTheme.availableColor,
                      ),
                      _stat(
                        icon: Icons.attach_money,
                        label: 'Price/h',
                        value: Helpers.formatPrice(p.pricePerHour),
                        color: AppTheme.warningColor,
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Action buttons
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _openNavigation,
                          icon: const Icon(Icons.navigation, size: 20),
                          label: const Text('Navigate'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) =>
                                    ParkingBlueprintScreen(parking: p),
                              ),
                            );
                          },
                          icon: const Icon(Icons.map_outlined, size: 20),
                          label: const Text('Blueprint'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _selectedSlot != null
                              ? () => _openReservation(_selectedSlot!)
                              : null,
                          icon: const Icon(Icons.bookmark_add_outlined,
                              size: 20),
                          label: const Text('Reserve'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const Divider(height: 1),

            // ── Slot section ──
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
              child: Row(
                children: [
                  const Text(
                    'Parking Slots',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const Spacer(),
                  _legendDot(AppTheme.availableColor, 'Free'),
                  const SizedBox(width: 10),
                  _legendDot(AppTheme.occupiedColor, 'Taken'),
                  const SizedBox(width: 10),
                  _legendDot(AppTheme.reservedColor, 'Reserved'),
                ],
              ),
            ),

            // Slot grid
            Consumer<ParkingProvider>(
              builder: (context, prov, _) {
                return SlotGrid(
                  slots: prov.slots,
                  isLoading: prov.isSlotsLoading,
                  selectedSlot: _selectedSlot,
                  onSlotTap: (slot) {
                    setState(() {
                      _selectedSlot =
                          _selectedSlot?.id == slot.id ? null : slot;
                    });
                  },
                );
              },
            ),

            // Selected slot info
            if (_selectedSlot != null) _selectedSlotInfo(),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _stat({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        margin: const EdgeInsets.symmetric(horizontal: 4),
        decoration: BoxDecoration(
          color: color.withAlpha(20),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 6),
            Text(
              value,
              style: TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 15,
                color: color,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(
                  fontSize: 11, color: AppTheme.textSecondary),
            ),
          ],
        ),
      ),
    );
  }

  Widget _legendDot(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 4),
        Text(label,
            style:
                const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
      ],
    );
  }

  Widget _selectedSlotInfo() {
    final slot = _selectedSlot!;
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.primaryColor.withAlpha(15),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.primaryColor.withAlpha(40)),
      ),
      child: Row(
        children: [
          const Icon(Icons.check_circle,
              color: AppTheme.primaryColor, size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Slot ${slot.slotNumber}',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                  ),
                ),
                Text(
                  '${slot.slotType}${slot.floor != null ? ' • Floor ${slot.floor}' : ''}',
                  style: const TextStyle(
                    color: AppTheme.textSecondary,
                    fontSize: 13,
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
            ),
            child: const Text('Book Now'),
          ),
        ],
      ),
    );
  }
}
