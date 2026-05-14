import 'package:flutter/material.dart';
import '../models/parking_slot.dart';
import '../utils/theme.dart';
import '../utils/helpers.dart';

class SlotGrid extends StatelessWidget {
  final List<ParkingSlot> slots;
  final bool isLoading;
  final ParkingSlot? selectedSlot;
  final void Function(ParkingSlot) onSlotTap;

  const SlotGrid({
    super.key,
    required this.slots,
    required this.isLoading,
    this.selectedSlot,
    required this.onSlotTap,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (slots.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(32),
        child: Center(
          child: Text(
            'No slots available',
            style: TextStyle(color: AppTheme.textSecondary, fontSize: 15),
          ),
        ),
      );
    }

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      itemCount: slots.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 4,
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        childAspectRatio: 1,
      ),
      itemBuilder: (context, index) {
        final slot = slots[index];
        final isSelected = selectedSlot?.id == slot.id;
        final color = AppTheme.slotStatusColor(slot.status);

        return GestureDetector(
          onTap: slot.isAvailable ? () => onSlotTap(slot) : null,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            decoration: BoxDecoration(
              color: isSelected
                  ? AppTheme.primaryColor
                  : slot.isAvailable
                      ? color.withAlpha(30)
                      : color.withAlpha(15),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isSelected ? AppTheme.primaryColor : color,
                width: isSelected ? 2 : 1,
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  _slotTypeIcon(slot.slotType),
                  size: 20,
                  color: isSelected ? Colors.white : color,
                ),
                const SizedBox(height: 4),
                Text(
                  slot.slotNumber,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: isSelected ? Colors.white : AppTheme.textPrimary,
                  ),
                ),
                Text(
                  Helpers.slotStatusLabel(slot.status),
                  style: TextStyle(
                    fontSize: 8,
                    color: isSelected ? Colors.white70 : color,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  IconData _slotTypeIcon(String type) {
    switch (type.toUpperCase()) {
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
}
