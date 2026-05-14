import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/providers/theme_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  test('defaults to ThemeMode.system', () {
    final tp = ThemeProvider();
    expect(tp.mode, ThemeMode.system);
  });

  test('setMode notifies listeners and persists value', () async {
    SharedPreferences.setMockInitialValues({});
    final tp = ThemeProvider();

    var notified = 0;
    tp.addListener(() => notified++);

    await tp.setMode(ThemeMode.dark);
    expect(tp.mode, ThemeMode.dark);
    expect(notified, greaterThanOrEqualTo(1));

    final prefs = await SharedPreferences.getInstance();
    expect(prefs.getString('app_theme_mode'), 'dark');
  });

  test('setMode is a no-op when mode is unchanged', () async {
    final tp = ThemeProvider();
    await tp.setMode(ThemeMode.system);

    var notified = 0;
    tp.addListener(() => notified++);
    await tp.setMode(ThemeMode.system);
    expect(notified, 0);
  });

  test('loads previously persisted mode', () async {
    SharedPreferences.setMockInitialValues({'app_theme_mode': 'dark'});
    final tp = ThemeProvider();
    // _load() is async — give it a microtask to complete.
    await Future<void>.delayed(const Duration(milliseconds: 10));
    expect(tp.mode, ThemeMode.dark);
  });
}

