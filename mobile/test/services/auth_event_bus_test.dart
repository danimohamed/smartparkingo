import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/services/auth_event_bus.dart';

void main() {
  test('emits sessionExpired to subscribers', () async {
    final received = <AuthEvent>[];
    final sub = AuthEventBus.instance.stream.listen(received.add);

    AuthEventBus.instance.emit(AuthEvent.sessionExpired);
    await Future<void>.delayed(Duration.zero);

    expect(received, contains(AuthEvent.sessionExpired));
    await sub.cancel();
  });

  test('emits loggedOut to subscribers', () async {
    final received = <AuthEvent>[];
    final sub = AuthEventBus.instance.stream.listen(received.add);

    AuthEventBus.instance.emit(AuthEvent.loggedOut);
    await Future<void>.delayed(Duration.zero);

    expect(received, contains(AuthEvent.loggedOut));
    await sub.cancel();
  });
}

