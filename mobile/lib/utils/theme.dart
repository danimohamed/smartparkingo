import 'package:flutter/material.dart';

class AppTheme {
  // Colors
  static const Color primaryColor = Color(0xFF2A85FF);
  static const Color secondaryColor = Color(0xFF1A1D1F);
  static const Color accentColor = Color(0xFF83BF6E);
  static const Color warningColor = Color(0xFFFFBC99);
  static const Color errorColor = Color(0xFFFF6A55);
  static const Color surfaceColor = Color(0xFFF4F4F4);
  static const Color cardColor = Colors.white;
  static const Color textPrimary = Color(0xFF1A1D1F);
  static const Color textSecondary = Color(0xFF6F767E);
  static const Color dividerColor = Color(0xFFEFEFEF);

  // Slot status colors
  static const Color availableColor = Color(0xFF83BF6E);
  static const Color occupiedColor = Color(0xFFFF6A55);
  static const Color reservedColor = Color(0xFFFFBC99);
  static const Color maintenanceColor = Color(0xFF6F767E);

  static Color slotStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'AVAILABLE':
        return availableColor;
      case 'OCCUPIED':
        return occupiedColor;
      case 'RESERVED':
        return reservedColor;
      case 'MAINTENANCE':
        return maintenanceColor;
      default:
        return textSecondary;
    }
  }

  static Color reservationStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return primaryColor;
      case 'COMPLETED':
        return accentColor;
      case 'CANCELLED':
        return errorColor;
      case 'NO_SHOW':
        return warningColor;
      default:
        return textSecondary;
    }
  }

  static Color paymentStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return warningColor;
      case 'COMPLETED':
        return accentColor;
      case 'FAILED':
        return errorColor;
      case 'REFUNDED':
        return textSecondary;
      default:
        return textSecondary;
    }
  }

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: primaryColor,
      scaffoldBackgroundColor: surfaceColor,
      colorScheme: const ColorScheme.light(
        primary: primaryColor,
        secondary: secondaryColor,
        surface: surfaceColor,
        error: errorColor,
      ),
      textTheme: ThemeData.light().textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: textPrimary,
        elevation: 0,
        centerTitle: true,
        surfaceTintColor: Colors.transparent,
        titleTextStyle: const TextStyle(
          color: textPrimary,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
      ),
      cardTheme: CardThemeData(
        color: cardColor,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primaryColor,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          side: const BorderSide(color: primaryColor),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: dividerColor),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: dividerColor),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primaryColor, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: errorColor),
        ),
        hintStyle: const TextStyle(color: textSecondary, fontSize: 14),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
      ),
      dividerTheme: const DividerThemeData(color: dividerColor, thickness: 1),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      primaryColor: primaryColor,
      scaffoldBackgroundColor: const Color(0xFF111315),
      colorScheme: const ColorScheme.dark(
        primary: primaryColor,
        secondary: Colors.white,
        surface: Color(0xFF1A1D1F),
        error: errorColor,
      ),
      textTheme: ThemeData.dark().textTheme,
      cardTheme: CardThemeData(
        color: const Color(0xFF1A1D1F),
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    );
  }
}
