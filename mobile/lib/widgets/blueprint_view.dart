import 'package:flutter/material.dart';
import '../models/parking_slot.dart';
import '../utils/theme.dart';
import '../utils/helpers.dart';

/// A professional 2D top-down blueprint view of a parking floor.
/// Renders slots in two rows (A-B-C top, D-E bottom) with a driving lane.
class BlueprintView extends StatefulWidget {
  final List<ParkingSlot> slots;
  final bool isLoading;
  final ParkingSlot? selectedSlot;
  final void Function(ParkingSlot) onSlotTap;
  final double? pricePerHour;

  const BlueprintView({
    super.key,
    required this.slots,
    required this.isLoading,
    this.selectedSlot,
    required this.onSlotTap,
    this.pricePerHour,
  });

  @override
  State<BlueprintView> createState() => _BlueprintViewState();
}

class _BlueprintViewState extends State<BlueprintView> {
  final TransformationController _transformController =
      TransformationController();

  @override
  void dispose() {
    _transformController.dispose();
    super.dispose();
  }

  List<ParkingSlot> _topRow(List<ParkingSlot> s) {
    final sorted = List<ParkingSlot>.from(s)
      ..sort((a, b) => a.slotNumber.compareTo(b.slotNumber));
    return sorted
        .where((slot) => ['A', 'B', 'C'].contains(slot.slotNumber.split('-').first))
        .toList();
  }

  List<ParkingSlot> _bottomRow(List<ParkingSlot> s) {
    final sorted = List<ParkingSlot>.from(s)
      ..sort((a, b) => a.slotNumber.compareTo(b.slotNumber));
    return sorted
        .where((slot) => ['D', 'E'].contains(slot.slotNumber.split('-').first))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.isLoading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(48),
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (widget.slots.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(48),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.local_parking, size: 64, color: AppTheme.textSecondary),
              SizedBox(height: 12),
              Text('No slots available',
                  style: TextStyle(color: AppTheme.textSecondary, fontSize: 15)),
            ],
          ),
        ),
      );
    }

    final top = _topRow(widget.slots);
    final bottom = _bottomRow(widget.slots);

    return InteractiveViewer(
      transformationController: _transformController,
      minScale: 0.4,
      maxScale: 3.0,
      boundaryMargin: const EdgeInsets.all(100),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Blueprint title
            Text(
              'FLOOR PLAN — BLUEPRINT VIEW',
              style: TextStyle(
                fontSize: 9,
                letterSpacing: 3,
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade400,
              ),
            ),
            const SizedBox(height: 16),

            // Entry marker
            _buildMarker(
              icon: Icons.arrow_downward,
              label: 'ENTRY',
              color: AppTheme.primaryColor,
            ),
            const SizedBox(height: 12),

            // Top row
            _buildSlotRow(top, 0),

            // Driving lane
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Row(
                children: [
                  Expanded(child: _dashedLine()),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    child: Text(
                      'DRIVING LANE',
                      style: TextStyle(
                        fontSize: 8,
                        letterSpacing: 2,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey.shade400,
                      ),
                    ),
                  ),
                  Expanded(child: _dashedLine()),
                ],
              ),
            ),

            // Bottom row
            _buildSlotRow(bottom, top.length),

            const SizedBox(height: 12),

            // Exit marker
            _buildMarker(
              icon: Icons.arrow_upward,
              label: 'EXIT',
              color: AppTheme.warningColor,
            ),

            const SizedBox(height: 16),

            // Legend
            _buildLegend(),
          ],
        ),
      ),
    );
  }

  Widget _buildSlotRow(List<ParkingSlot> rowSlots, int startIndex) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      alignment: WrapAlignment.center,
      children: List.generate(rowSlots.length, (i) {
        final slot = rowSlots[i];
        return _BlueprintSlotTile(
          slot: slot,
          isSelected: widget.selectedSlot?.id == slot.id,
          onTap: () => slot.isAvailable ? widget.onSlotTap(slot) : null,
          pricePerHour: widget.pricePerHour,
        );
      }),
    );
  }

  Widget _buildMarker({
    required IconData icon,
    required String label,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(
        color: color.withAlpha(20),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withAlpha(60)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.5,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _dashedLine() {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        const dashWidth = 6.0;
        const dashSpace = 4.0;
        final dashCount = (width / (dashWidth + dashSpace)).floor();
        return Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(dashCount, (_) {
            return Container(
              width: dashWidth,
              height: 1.5,
              margin: const EdgeInsets.only(right: dashSpace),
              color: Colors.grey.shade300,
            );
          }),
        );
      },
    );
  }

  Widget _buildLegend() {
    final items = [
      ('Available', AppTheme.availableColor),
      ('Occupied', AppTheme.occupiedColor),
      ('Reserved', AppTheme.reservedColor),
      ('Maintenance', AppTheme.maintenanceColor),
    ];
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: items.map((item) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: item.$2,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 4),
              Text(
                item.$1,
                style: TextStyle(
                    fontSize: 9,
                    color: Colors.grey.shade500,
                    fontWeight: FontWeight.w500),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}

// ─── Individual slot tile ─────────────────────────

class _BlueprintSlotTile extends StatelessWidget {
  final ParkingSlot slot;
  final bool isSelected;
  final VoidCallback? onTap;
  final double? pricePerHour;

  const _BlueprintSlotTile({
    required this.slot,
    required this.isSelected,
    this.onTap,
    this.pricePerHour,
  });

  Color get _statusColor => AppTheme.slotStatusColor(slot.status);

  IconData get _typeIcon {
    switch (slot.slotType.toUpperCase()) {
      case 'HANDICAPPED':
        return Icons.accessible;
      case 'VIP':
        return Icons.star;
      case 'ELECTRIC':
        return Icons.ev_station;
      default:
        return Icons.directions_car;
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _statusColor;
    final isAvailable = slot.isAvailable;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeInOut,
        width: 68,
        height: 96,
        decoration: BoxDecoration(
          color: isSelected
              ? AppTheme.primaryColor
              : isAvailable
                  ? color.withAlpha(20)
                  : color.withAlpha(12),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? AppTheme.primaryColor
                : color.withAlpha(80),
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppTheme.primaryColor.withAlpha(60),
                    blurRadius: 12,
                    spreadRadius: 2,
                  )
                ]
              : isAvailable
                  ? [
                      BoxShadow(
                        color: color.withAlpha(20),
                        blurRadius: 6,
                      )
                    ]
                  : [],
        ),
        child: Stack(
          children: [
            // Diagonal parking lines (visual)
            Positioned(
              top: 0,
              left: 0,
              child: CustomPaint(
                size: const Size(68, 96),
                painter: _ParkingLinePainter(
                  color: color.withAlpha(15),
                ),
              ),
            ),

            // Content
            Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    _typeIcon,
                    size: 18,
                    color: isSelected ? Colors.white : color,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    slot.slotNumber,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: isSelected
                          ? Colors.white
                          : AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Container(
                    width: 5,
                    height: 5,
                    decoration: BoxDecoration(
                      color: isSelected ? Colors.white : color,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(height: 1),
                  Text(
                    Helpers.slotStatusLabel(slot.status),
                    style: TextStyle(
                      fontSize: 7,
                      color: isSelected
                          ? Colors.white70
                          : Colors.grey.shade500,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),

            // Selected checkmark
            if (isSelected)
              Positioned(
                top: -1,
                right: -1,
                child: Container(
                  width: 18,
                  height: 18,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withAlpha(30),
                        blurRadius: 4,
                      )
                    ],
                  ),
                  child: const Icon(
                    Icons.check,
                    size: 12,
                    color: AppTheme.primaryColor,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// ─── Custom painter for diagonal parking lines ──────

class _ParkingLinePainter extends CustomPainter {
  final Color color;
  _ParkingLinePainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 0.8;

    canvas.drawLine(Offset.zero, Offset(size.width, size.height), paint);
    canvas.drawLine(
      Offset(size.width * 0.25, 0),
      Offset(size.width, size.height * 0.75),
      paint..strokeWidth = 0.4,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}




