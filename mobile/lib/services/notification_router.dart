import 'package:flutter/material.dart';

import '../screens/chat/guard_chats_list_screen.dart';
import '../screens/guard/guard_home_screen.dart';
import '../screens/main/main_screen.dart';
import '../screens/reservations/my_reservations_screen.dart';

/// Maps an FCM payload (`data` map) to a navigation action against the global
/// [navigatorKey]. Called from [PushNotificationsService] when the user taps a
/// notification (foreground / background / terminated).
class NotificationRouter {
  NotificationRouter._();

  static final GlobalKey<NavigatorState> navigatorKey =
      GlobalKey<NavigatorState>();

  /// Routes a notification payload to the appropriate screen.
  ///
  /// Expected `data` keys:
  ///   - `type`: one of `reservation`, `chat`, `guard_scan`
  ///   - `id`  : optional resource id (reservation id, chat id, ...)
  static Future<void> handle(Map<String, dynamic> data) async {
    final state = navigatorKey.currentState;
    if (state == null) return;

    final type = (data['type'] ?? '').toString().toLowerCase();
    switch (type) {
      case 'reservation':
        await state.push(
          MaterialPageRoute(
            builder: (_) => const MyReservationsScreen(),
          ),
        );
        break;
      case 'chat':
        await state.push(
          MaterialPageRoute(
            builder: (_) => const GuardChatsListScreen(),
          ),
        );
        break;
      case 'guard_scan':
        await state.push(
          MaterialPageRoute(
            builder: (_) => const GuardHomeScreen(),
          ),
        );
        break;
      default:
        // Unknown payload — fall back to the main home so the user lands
        // somewhere sensible instead of getting nothing on tap.
        await state.push(
          MaterialPageRoute(builder: (_) => const MainScreen()),
        );
    }
  }
}

