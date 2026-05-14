import 'package:flutter/material.dart';

import '../../models/guard_scan_result.dart';
import '../../utils/helpers.dart';

class GuardScanResultScreen extends StatelessWidget {
  final GuardScanResult result;

  const GuardScanResultScreen({super.key, required this.result});

  @override
  Widget build(BuildContext context) {
    final ok = result.valid;
    final bg = ok ? const Color(0xFF15803D) : const Color(0xFFB91C1C);
    final r = result.reservation;

    return Scaffold(
      backgroundColor: bg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 24),
              Icon(
                ok ? Icons.check_circle_outline : Icons.cancel_outlined,
                size: 88,
                color: Colors.white,
              ),
              const SizedBox(height: 16),
              Text(
                ok ? 'VALID' : 'REJECTED',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 40,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                  letterSpacing: 2,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                result.message,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.white.withValues(alpha: 0.95),
                ),
              ),
              if (r != null) ...[
                const SizedBox(height: 32),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        r.parkingName,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Slot ${r.slotNumber}',
                        style: const TextStyle(color: Colors.white70),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${Helpers.formatDate(r.startTime)} → ${Helpers.formatTime(r.endTime)}',
                        style: const TextStyle(color: Colors.white70, fontSize: 13),
                      ),
                      if (r.userFullName.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Text(
                          r.userFullName,
                          style: const TextStyle(color: Colors.white70),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
              const Spacer(),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: bg,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                onPressed: () => Navigator.pop(context),
                child: const Text('Done', style: TextStyle(fontSize: 16)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
