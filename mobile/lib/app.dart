import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';

import 'generated/l10n/app_localizations.dart';
import 'providers/auth_provider.dart';
import 'providers/locale_provider.dart';
import 'providers/theme_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/splash_screen.dart';
import 'services/auth_event_bus.dart';
import 'services/notification_router.dart';
import 'utils/theme.dart';

class SmartParkingApp extends StatefulWidget {
  const SmartParkingApp({super.key});

  @override
  State<SmartParkingApp> createState() => _SmartParkingAppState();
}

class _SmartParkingAppState extends State<SmartParkingApp> {
  StreamSubscription<AuthEvent>? _authSub;

  @override
  void initState() {
    super.initState();
    _authSub = AuthEventBus.instance.stream.listen(_onAuthEvent);
  }

  void _onAuthEvent(AuthEvent event) {
    final navState = NotificationRouter.navigatorKey.currentState;
    if (navState == null) return;

    navState.pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );

    final ctx = NotificationRouter.navigatorKey.currentContext;
    if (ctx != null) {
      try {
        ctx.read<AuthProvider>().logout();
      } catch (_) {}
      if (event == AuthEvent.sessionExpired) {
        final l10n = AppLocalizations.of(ctx);
        ScaffoldMessenger.of(ctx).showSnackBar(
          SnackBar(
            content: Text(
              l10n?.errorSessionExpired ?? 'Session expired. Please sign in again.',
            ),
            duration: const Duration(seconds: 4),
          ),
        );
      }
    }
  }

  @override
  void dispose() {
    _authSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer2<ThemeProvider, LocaleProvider>(
      builder: (context, theme, localeProv, _) {
        return MaterialApp(
          title: 'Smart Parking',
          debugShowCheckedModeBanner: false,
          navigatorKey: NotificationRouter.navigatorKey,
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: theme.mode,
          // ----- i18n -----
          locale: localeProv.locale,
          supportedLocales: LocaleProvider.supportedLocales,
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          localeResolutionCallback: LocaleProvider.resolve,
          home: const SplashScreen(),
        );
      },
    );
  }
}
