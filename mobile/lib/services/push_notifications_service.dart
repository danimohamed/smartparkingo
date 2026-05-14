import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:timezone/data/latest.dart' as tz;
import 'package:timezone/timezone.dart' as tz;

import 'notification_router.dart';

/// Thin wrapper around [FlutterLocalNotificationsPlugin].
///
/// Firebase / FCM has been removed — the backend pushes notifications via
/// WebSocket or in-app polling. Call [showNotification] from wherever you
/// want to surface a local banner (e.g. a WebSocket message handler).
class PushNotificationsService {
  PushNotificationsService._();

  static final PushNotificationsService instance = PushNotificationsService._();

  final FlutterLocalNotificationsPlugin _local =
      FlutterLocalNotificationsPlugin();

  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'default',
    'Notifications',
    description: 'Smart Parking notifications',
    importance: Importance.high,
  );

  Future<void> init() async {
    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(android: androidInit);

    // Timezone init for scheduled notifications (match device local zone).
    try {
      tz.initializeTimeZones();
      final nativeTz = await FlutterTimezone.getLocalTimezone();
      tz.setLocalLocation(tz.getLocation(nativeTz.identifier));
    } catch (_) {
      try {
        tz.initializeTimeZones();
      } catch (_) {}
    }

    await _local.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (response) {
        final payload = response.payload;
        if (payload == null || payload.isEmpty) return;
        // Payload is encoded as `key=value;key=value`.
        final data = <String, dynamic>{};
        for (final part in payload.split(';')) {
          final i = part.indexOf('=');
          if (i > 0) data[part.substring(0, i)] = part.substring(i + 1);
        }
        NotificationRouter.handle(data);
      },
    );

    final androidPlugin = _local
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>();
    await androidPlugin?.createNotificationChannel(_channel);

    // Android 13+ runtime permission (best-effort).
    try {
      await androidPlugin?.requestNotificationsPermission();
    } catch (_) {}
  }

  /// Show a local notification banner. [data] is optional routing payload
  /// (same format used by [NotificationRouter]).
  Future<void> showNotification({
    required String title,
    required String body,
    Map<String, dynamic>? data,
  }) async {
    if (title.isEmpty && body.isEmpty) return;

    final details = NotificationDetails(
      android: AndroidNotificationDetails(
        _channel.id,
        _channel.name,
        channelDescription: _channel.description,
        importance: Importance.high,
        priority: Priority.high,
      ),
    );

    await _local.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      details,
      payload: data != null ? _encodePayload(data) : null,
    );
  }

  Future<void> scheduleNotification({
    required DateTime when,
    required String title,
    required String body,
    Map<String, dynamic>? data,
  }) async {
    final now = DateTime.now();
    if (!when.isAfter(now)) return;

    final details = NotificationDetails(
      android: AndroidNotificationDetails(
        _channel.id,
        _channel.name,
        channelDescription: _channel.description,
        importance: Importance.high,
        priority: Priority.high,
      ),
    );

    await _local.zonedSchedule(
      when.millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      tz.TZDateTime.from(when, tz.local),
      details,
      payload: data != null ? _encodePayload(data) : null,
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
    );
  }

  String _encodePayload(Map<String, dynamic> data) =>
      data.entries.map((e) => '${e.key}=${e.value}').join(';');

  void dispose() {}
}

