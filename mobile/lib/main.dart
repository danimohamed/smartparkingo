import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'app.dart';
import 'providers/auth_provider.dart';
import 'providers/parking_provider.dart';
import 'providers/reservation_provider.dart';
import 'providers/payment_provider.dart';
import 'providers/navigation_provider.dart';
import 'providers/wallet_provider.dart';
import 'providers/chat_provider.dart';
import 'providers/theme_provider.dart';
import 'providers/locale_provider.dart';
import 'services/push_notifications_service.dart';
import 'utils/constants.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Surface missing build-time secrets early so devs notice immediately.
  final missing = AppConstants.missingSecrets();
  if (missing.isNotEmpty) {
    debugPrint(
      '⚠️  Missing build-time secrets: ${missing.join(', ')}.\n'
      '   Pass them via --dart-define=KEY=value when launching Flutter.\n'
      '   AI / map features will be disabled until configured.',
    );
  }

  debugPrint('🌐 API base URL: ${ApiConstants.baseUrl}');

  // Initialise local notifications (no Firebase required).
  try {
    await PushNotificationsService.instance.init();
  } catch (e) {
    debugPrint('Local notifications init skipped: $e');
  }

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
  ]);

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => LocaleProvider()..load()),
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ParkingProvider()),
        ChangeNotifierProvider(create: (_) => ReservationProvider()),
        ChangeNotifierProvider(create: (_) => PaymentProvider()),
        ChangeNotifierProvider(create: (_) => NavigationProvider()),
        ChangeNotifierProvider(create: (_) => WalletProvider()),
        ChangeNotifierProvider(create: (_) => ChatProvider()),
      ],
      child: const SmartParkingApp(),
    ),
  );
}
