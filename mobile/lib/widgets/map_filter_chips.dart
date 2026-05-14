import 'package:flutter/material.dart';
import '../../utils/theme.dart';

class MapFilterChips extends StatefulWidget {
  final Function(MapFilters) onFiltersChanged;

  const MapFilterChips({super.key, required this.onFiltersChanged});

  @override
  State<MapFilterChips> createState() => _MapFilterChipsState();
}

class _MapFilterChipsState extends State<MapFilterChips> {
  int _selectedDistance = 10;
  String _selectedType = 'all';
  bool _availableOnly = false;

  void _update() {
    widget.onFiltersChanged(MapFilters(
      maxDistance: _selectedDistance.toDouble(),
      parkingType: _selectedType,
      availableOnly: _availableOnly,
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(230),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(10),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        child: Row(
          children: [
          // Distance filter
          _buildFilterGroup(
            icon: Icons.near_me,
            options: [
              _FilterOption('1km', 1),
              _FilterOption('3km', 3),
              _FilterOption('5km', 5),
              _FilterOption('10km', 10),
            ],
            selectedValue: _selectedDistance,
            onSelected: (val) {
              setState(() => _selectedDistance = val);
              _update();
            },
          ),
          const SizedBox(width: 8),

          // Divider
          Container(
            width: 1,
            height: 28,
            color: AppTheme.dividerColor,
          ),
          const SizedBox(width: 8),

          // Type filter
          _typeChip('All', 'all', Icons.local_parking),
          const SizedBox(width: 6),
          _typeChip('Covered', 'Covered', Icons.garage_outlined),
          const SizedBox(width: 6),
          _typeChip('Outdoor', 'Outdoor', Icons.wb_sunny_outlined),
          const SizedBox(width: 6),
          _typeChip('EV', 'EV Charging', Icons.ev_station_outlined),

          const SizedBox(width: 8),
          Container(
            width: 1,
            height: 28,
            color: AppTheme.dividerColor,
          ),
          const SizedBox(width: 8),

          // Available only
          GestureDetector(
            onTap: () {
              setState(() => _availableOnly = !_availableOnly);
              _update();
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: _availableOnly
                    ? AppTheme.accentColor
                    : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: _availableOnly
                      ? AppTheme.accentColor
                      : AppTheme.dividerColor,
                ),
                boxShadow: _availableOnly
                    ? [
                        BoxShadow(
                          color: AppTheme.accentColor.withAlpha(60),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        )
                      ]
                    : null,
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.check_circle_outline,
                    size: 14,
                    color: _availableOnly ? Colors.white : AppTheme.textSecondary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'Available',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: _availableOnly ? Colors.white : AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 12),
        ],
      ),
      ),
    );
  }

  Widget _buildFilterGroup<T>({
    required IconData icon,
    required List<_FilterOption<T>> options,
    required T selectedValue,
    required ValueChanged<T> onSelected,
  }) {
    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.dividerColor),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 6),
            child: Icon(icon, size: 14, color: AppTheme.primaryColor),
          ),
          ...options.map((opt) {
            final isSelected = opt.value == selectedValue;
            return GestureDetector(
              onTap: () => onSelected(opt.value),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: isSelected ? AppTheme.primaryColor : Colors.transparent,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  opt.label,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: isSelected ? Colors.white : AppTheme.textSecondary,
                  ),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _typeChip(String label, String value, IconData icon) {
    final isSelected = _selectedType == value;
    return GestureDetector(
      onTap: () {
        setState(() => _selectedType = value);
        _update();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF6366F1) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFF6366F1) : AppTheme.dividerColor,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: const Color(0xFF6366F1).withAlpha(60),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  )
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 14,
              color: isSelected ? Colors.white : AppTheme.textSecondary,
            ),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: isSelected ? Colors.white : AppTheme.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterOption<T> {
  final String label;
  final T value;
  _FilterOption(this.label, this.value);
}

class MapFilters {
  final double maxDistance;
  final String parkingType;
  final bool availableOnly;

  const MapFilters({
    this.maxDistance = 10,
    this.parkingType = 'all',
    this.availableOnly = false,
  });
}



