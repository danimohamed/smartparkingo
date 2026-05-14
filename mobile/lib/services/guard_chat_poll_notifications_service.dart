import 'dart:async';

import '../services/guard_chat_service.dart';
import '../services/push_notifications_service.dart';

/// Polls guard chats list periodically and raises local notifications when
/// a chat updates while the app is running (foreground/background in-memory).
///
/// This is a fallback when push (FCM) isn't configured.
class GuardChatPollNotificationsService {
  GuardChatPollNotificationsService._();
  static final GuardChatPollNotificationsService instance =
      GuardChatPollNotificationsService._();

  final GuardChatService _api = GuardChatService();
  Timer? _timer;
  bool _primed = false;
  final Map<int, DateTime> _lastSeen = {};

  void start() {
    stop();
    _primed = false;
    _timer = Timer.periodic(const Duration(seconds: 15), (_) => _tick());
    // Run once immediately.
    _tick();
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
    _primed = false;
    _lastSeen.clear();
  }

  Future<void> _tick() async {
    try {
      final chats = await _api.listChats();
      if (!_primed) {
        for (final c in chats) {
          final t = c.updatedAt;
          if (t != null) _lastSeen[c.id] = t;
        }
        _primed = true;
        return;
      }

      for (final c in chats) {
        final t = c.updatedAt;
        if (t == null) continue;
        final prev = _lastSeen[c.id];
        _lastSeen[c.id] = t;
        if (prev != null && t.isAfter(prev)) {
          await PushNotificationsService.instance.showNotification(
            title: 'New chat message',
            body: '${c.peerFullName} · ${c.parkingName}',
            data: {'type': 'chat', 'id': c.id},
          );
        }
      }
    } catch (_) {
      // silent: best-effort
    }
  }
}

