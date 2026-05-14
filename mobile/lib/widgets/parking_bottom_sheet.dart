import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../models/parking.dart';
import '../utils/theme.dart';
import 'parking_card.dart';
import 'loading_skeleton.dart';

class ParkingBottomSheet extends StatelessWidget {
  final List<Parking> parkings;
  final bool isLoading;
  final Position? userLocation;
  final void Function(Parking) onParkingTap;
  final void Function(Parking) onParkingLocate;

  const ParkingBottomSheet({
    super.key,
    required this.parkings,
    required this.isLoading,
    this.userLocation,
    required this.onParkingTap,
    required this.onParkingLocate,
  });

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.30,
      minChildSize: 0.10,
      maxChildSize: 0.85,
      snap: true,
      snapSizes: const [0.10, 0.30, 0.85],
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            boxShadow: [
              BoxShadow(
                color: Colors.black12,
                blurRadius: 20,
                offset: Offset(0, -4),
              ),
            ],
          ),
          child: Column(
            children: [
              // Handle bar
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppTheme.dividerColor,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // Header
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                child: Row(
                  children: [
                    const Icon(Icons.local_parking,
                        color: AppTheme.primaryColor, size: 22),
                    const SizedBox(width: 8),
                    Text(
                      'Parkings Nearby',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 17,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: parkings.isEmpty
                            ? AppTheme.textSecondary.withAlpha(25)
                            : AppTheme.primaryColor.withAlpha(25),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${parkings.length} found',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                          color: parkings.isEmpty
                              ? AppTheme.textSecondary
                              : AppTheme.primaryColor,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const Divider(),

              // List
              Expanded(
                child: isLoading
                    ? const LoadingSkeleton(count: 4)
                    : parkings.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.local_parking,
                                    size: 48,
                                    color: AppTheme.textSecondary
                                        .withAlpha(100)),
                                const SizedBox(height: 12),
                                const Text(
                                  'No parking found nearby',
                                  style: TextStyle(
                                    color: AppTheme.textSecondary,
                                    fontSize: 15,
                                  ),
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
                            controller: scrollController,
                            padding: const EdgeInsets.only(bottom: 20),
                            itemCount: parkings.length,
                            itemBuilder: (context, index) {
                              final parking = parkings[index];
                              return ParkingCard(
                                parking: parking,
                                onTap: () => onParkingTap(parking),
                                onLocate: parking.hasLocation
                                    ? () => onParkingLocate(parking)
                                    : null,
                              );
                            },
                          ),
              ),
            ],
          ),
        );
      },
    );
  }
}
