import 'package:flutter/material.dart';
import '../../utils/theme.dart';

/// Destination marker pin
class ParkingDestinationMarker extends StatelessWidget {
  final String label;

  const ParkingDestinationMarker({super.key, required this.label});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(10),
            boxShadow: const [
              BoxShadow(color: Colors.black26, blurRadius: 6),
            ],
          ),
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
        ),
        const Icon(
          Icons.location_on,
          size: 40,
          color: AppTheme.errorColor,
        ),
      ],
    );
  }
}
