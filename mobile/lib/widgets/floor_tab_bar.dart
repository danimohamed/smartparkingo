import 'package:flutter/material.dart';
import '../utils/theme.dart';

/// A horizontal scrollable tab bar for selecting parking floors.
/// Mimics the frontend FloorSelector with smooth animated indicator.
class FloorTabBar extends StatelessWidget {
  final List<String> floors;
  final String activeFloor;
  final ValueChanged<String> onFloorChanged;

  const FloorTabBar({
    super.key,
    required this.floors,
    required this.activeFloor,
    required this.onFloorChanged,
  });

  @override
  Widget build(BuildContext context) {
    if (floors.length <= 1) return const SizedBox.shrink();

    return SizedBox(
      height: 44,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: floors.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final floor = floors[index];
          final isActive = floor == activeFloor;

          return GestureDetector(
            onTap: () => onFloorChanged(floor),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              curve: Curves.easeInOut,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              decoration: BoxDecoration(
                color: isActive
                    ? AppTheme.primaryColor
                    : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(12),
                boxShadow: isActive
                    ? [
                        BoxShadow(
                          color: AppTheme.primaryColor.withAlpha(60),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        )
                      ]
                    : [],
              ),
              child: Center(
                child: Text(
                  floor,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: isActive ? Colors.white : AppTheme.textSecondary,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

