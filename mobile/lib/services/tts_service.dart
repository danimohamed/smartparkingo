import 'package:flutter_tts/flutter_tts.dart';

class TtsService {
  static TtsService? _instance;
  final FlutterTts _tts = FlutterTts();
  bool _initialized = false;

  TtsService._();

  factory TtsService() {
    _instance ??= TtsService._();
    return _instance!;
  }

  Future<void> init() async {
    if (_initialized) return;
    await _tts.setLanguage('en-US');
    await _tts.setSpeechRate(0.5);
    await _tts.setVolume(1.0);
    await _tts.setPitch(1.0);
    _initialized = true;
  }

  Future<void> speak(String text) async {
    if (!_initialized) await init();
    await _tts.stop();
    await _tts.speak(text);
  }

  Future<void> stop() async {
    await _tts.stop();
  }

  Future<void> dispose() async {
    await _tts.stop();
  }
}
