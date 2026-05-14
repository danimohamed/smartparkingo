import 'package:flutter/material.dart';

import '../../../utils/theme.dart';

/// Soft branded backdrop used on sign-in / sign-up.
class AuthBrandedBackground extends StatelessWidget {
  const AuthBrandedBackground({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: isDark
              ? [
                  AppTheme.primaryColor.withValues(alpha: 0.22),
                  const Color(0xFF1A1D1F),
                  const Color(0xFF111315),
                ]
              : [
                  AppTheme.primaryColor.withValues(alpha: 0.14),
                  Colors.white,
                  AppTheme.surfaceColor,
                ],
          stops: const [0.0, 0.38, 1.0],
        ),
      ),
      child: child,
    );
  }
}

/// White elevated surface for form fields.
class AuthFormSurface extends StatelessWidget {
  const AuthFormSurface({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 22, 20, 22),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1A1D1F) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: isDark
            ? Border.all(color: Colors.white.withValues(alpha: 0.06))
            : null,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.07),
            blurRadius: 28,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: child,
    );
  }
}
