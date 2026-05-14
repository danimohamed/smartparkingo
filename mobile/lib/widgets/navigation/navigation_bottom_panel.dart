import 'package:flutter/material.dart';
import '../../models/navigation_route.dart';
import '../../utils/theme.dart';

/// Uber-style bottom panel showing navigation progress
class NavigationBottomPanel extends StatelessWidget {
  final String parkingName;
  final String remainingDistance;
  final String remainingDuration;
  final String eta;
  final String speedText;
  final NavigationStep? currentStep;
  final NavigationStep? nextStep;
  final bool isRecalculating;
  final bool voiceEnabled;
  final VoidCallback onCancel;
  final VoidCallback onToggleVoice;

  const NavigationBottomPanel({
    super.key,
    required this.parkingName,
    required this.remainingDistance,
    required this.remainingDuration,
    required this.eta,
    this.speedText = '0 km/h',
    this.currentStep,
    this.nextStep,
    this.isRecalculating = false,
    this.voiceEnabled = true,
    required this.onCancel,
    required this.onToggleVoice,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(30),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Current step instruction
            if (currentStep != null) _buildStepBanner(currentStep!),

            // Progress info
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: Row(
                children: [
                  // ETA
                  Expanded(
                    child: _infoTile(
                      icon: Icons.access_time_filled,
                      label: 'ETA',
                      value: eta,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                  Container(
                    width: 1,
                    height: 44,
                    color: AppTheme.dividerColor,
                  ),
                  // Distance
                  Expanded(
                    child: _infoTile(
                      icon: Icons.route,
                      label: 'Distance',
                      value: remainingDistance,
                      color: AppTheme.accentColor,
                    ),
                  ),
                  Container(
                    width: 1,
                    height: 44,
                    color: AppTheme.dividerColor,
                  ),
                  // Duration
                  Expanded(
                    child: _infoTile(
                      icon: Icons.timer_outlined,
                      label: 'Time',
                      value: remainingDuration,
                      color: AppTheme.warningColor,
                    ),
                  ),
                  Container(
                    width: 1,
                    height: 44,
                    color: AppTheme.dividerColor,
                  ),
                  // Speed
                  Expanded(
                    child: _infoTile(
                      icon: Icons.speed,
                      label: 'Speed',
                      value: speedText,
                      color: const Color(0xFF6366F1),
                    ),
                  ),
                ],
              ),
            ),

            if (isRecalculating)
              const Padding(
                padding: EdgeInsets.only(top: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                    SizedBox(width: 8),
                    Text(
                      'Recalculating route...',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),

            // Destination
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withAlpha(20),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.local_parking,
                        color: AppTheme.primaryColor, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Heading to',
                          style: TextStyle(
                              fontSize: 11, color: AppTheme.textSecondary),
                        ),
                        Text(
                          parkingName,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  // Voice toggle
                  IconButton(
                    icon: Icon(
                      voiceEnabled ? Icons.volume_up : Icons.volume_off,
                      color: voiceEnabled
                          ? AppTheme.primaryColor
                          : AppTheme.textSecondary,
                    ),
                    onPressed: onToggleVoice,
                  ),
                ],
              ),
            ),

            // Cancel button
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
              child: SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: onCancel,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.errorColor,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 0,
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.close, size: 20),
                      SizedBox(width: 8),
                      Text(
                        'Cancel Navigation',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStepBanner(NavigationStep step) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.primaryColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          _turnIcon(step),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  step.voiceInstruction,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                if (nextStep != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      'Then: ${nextStep!.voiceInstruction}',
                      style: TextStyle(
                        color: Colors.white.withAlpha(180),
                        fontSize: 12,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _turnIcon(NavigationStep step) {
    IconData icon;
    switch (step.type) {
      case 'turn':
        icon = step.modifier.contains('left')
            ? Icons.turn_left
            : Icons.turn_right;
        break;
      case 'arrive':
        icon = Icons.flag;
        break;
      case 'depart':
        icon = Icons.navigation;
        break;
      case 'roundabout':
        icon = Icons.roundabout_left;
        break;
      default:
        icon = Icons.straight;
    }

    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(40),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Icon(icon, color: Colors.white, size: 26),
    );
  }

  Widget _infoTile({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Column(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(height: 4),
        Text(
          value.isNotEmpty ? value : '--',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
        ),
      ],
    );
  }
}
