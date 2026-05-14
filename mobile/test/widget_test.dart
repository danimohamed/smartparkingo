import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/utils/theme.dart';

void main() {
  testWidgets('AppTheme.lightTheme builds a working MaterialApp', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.lightTheme,
        home: const Scaffold(body: Text('Smart Parking')),
      ),
    );
    expect(find.text('Smart Parking'), findsOneWidget);
  });

  test('slotStatusColor maps known statuses', () {
    expect(AppTheme.slotStatusColor('AVAILABLE'), AppTheme.availableColor);
    expect(AppTheme.slotStatusColor('OCCUPIED'), AppTheme.occupiedColor);
    expect(AppTheme.slotStatusColor('RESERVED'), AppTheme.reservedColor);
    expect(AppTheme.slotStatusColor('MAINTENANCE'), AppTheme.maintenanceColor);
  });
}
