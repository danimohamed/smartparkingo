import 'package:flutter/material.dart';
import 'dart:math' as math;
import '../../utils/theme.dart';

/// Animated car marker with heading rotation and pulse effect
class AnimatedUserMarker extends StatefulWidget {
  final double heading;
  final double size;

  const AnimatedUserMarker({
    super.key,
    this.heading = 0,
    this.size = 56,
  });

  @override
  State<AnimatedUserMarker> createState() => _AnimatedUserMarkerState();
}

class _AnimatedUserMarkerState extends State<AnimatedUserMarker>
    with TickerProviderStateMixin {
  late AnimationController _pulseCtrl;
  late AnimationController _headingCtrl;
  late Animation<double> _pulseAnim;
  late Animation<double> _headingAnim;
  double _prevHeading = 0;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat();
    _pulseAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeOut),
    );

    _headingCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _headingAnim = Tween<double>(
      begin: widget.heading,
      end: widget.heading,
    ).animate(CurvedAnimation(parent: _headingCtrl, curve: Curves.easeOut));
    _prevHeading = widget.heading;
  }

  @override
  void didUpdateWidget(covariant AnimatedUserMarker oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.heading != widget.heading) {
      _headingAnim = Tween<double>(
        begin: _prevHeading,
        end: widget.heading,
      ).animate(CurvedAnimation(parent: _headingCtrl, curve: Curves.easeOut));
      _headingCtrl.forward(from: 0);
      _prevHeading = widget.heading;
    }
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    _headingCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = widget.size;

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Pulse ring
          AnimatedBuilder(
            animation: _pulseAnim,
            builder: (context, child) {
              return Container(
                width: size * (0.6 + 0.4 * _pulseAnim.value),
                height: size * (0.6 + 0.4 * _pulseAnim.value),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppTheme.primaryColor
                      .withAlpha((60 * (1 - _pulseAnim.value)).round()),
                ),
              );
            },
          ),

          // Car icon with heading rotation
          AnimatedBuilder(
            animation: _headingAnim,
            builder: (context, child) {
              return Transform.rotate(
                angle: _headingAnim.value * (math.pi / 180),
                child: Container(
                  width: size * 0.65,
                  height: size * 0.65,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor,
                    borderRadius: BorderRadius.circular(size * 0.18),
                    border: Border.all(color: Colors.white, width: 2.5),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withAlpha(60),
                        blurRadius: 10,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.directions_car,
                    color: Colors.white,
                    size: 22,
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
