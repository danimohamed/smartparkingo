import 'package:flutter/material.dart';
import '../models/parking.dart';
import '../utils/theme.dart';
import '../utils/helpers.dart';

class ParkingCard extends StatelessWidget {
  final Parking parking;
  final VoidCallback onTap;
  final VoidCallback? onLocate;

  const ParkingCard({
    super.key,
    required this.parking,
    required this.onTap,
    this.onLocate,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Parking icon
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: parking.availableSlots > 0
                      ? AppTheme.availableColor.withAlpha(25)
                      : AppTheme.errorColor.withAlpha(25),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(
                  Icons.local_parking,
                  color: parking.availableSlots > 0
                      ? AppTheme.availableColor
                      : AppTheme.errorColor,
                  size: 28,
                ),
              ),
              const SizedBox(width: 14),

              // Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      parking.name,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                        color: AppTheme.textPrimary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined,
                            size: 14, color: AppTheme.textSecondary),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            parking.address,
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppTheme.textSecondary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _chip(
                          '${parking.availableSlots} free',
                          parking.availableSlots > 0
                              ? AppTheme.availableColor
                              : AppTheme.errorColor,
                        ),
                        const SizedBox(width: 8),
                        _chip(
                          '${Helpers.formatPrice(parking.pricePerHour)}/h',
                          AppTheme.primaryColor,
                        ),
                        if (parking.distance != null) ...[
                          const Spacer(),
                          Text(
                            Helpers.formatDistance(parking.distance!),
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),

              // Locate button
              if (onLocate != null)
                IconButton(
                  icon: const Icon(Icons.near_me,
                      color: AppTheme.primaryColor, size: 22),
                  onPressed: onLocate,
                  tooltip: 'Show on map',
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _chip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withAlpha(25),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}
