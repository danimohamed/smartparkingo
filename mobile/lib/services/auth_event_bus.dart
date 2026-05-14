import 'dart:async';

/// Global app-wide auth events. Emitted by the Dio interceptor when the
/// backend rejects the JWT (HTTP 401), or by [AuthProvider] on logout.
enum AuthEvent {
  /// Token expired / rejected — UI should hard-redirect to LoginScreen.
  sessionExpired,

  /// User-initiated logout — UI should redirect to LoginScreen silently.
  loggedOut,
}

class AuthEventBus {
  AuthEventBus._();

  static final AuthEventBus instance = AuthEventBus._();

  final StreamController<AuthEvent> _controller =
      StreamController<AuthEvent>.broadcast();

  Stream<AuthEvent> get stream => _controller.stream;

  void emit(AuthEvent event) {
    if (!_controller.isClosed) _controller.add(event);
  }

  void dispose() {
    _controller.close();
  }
}

