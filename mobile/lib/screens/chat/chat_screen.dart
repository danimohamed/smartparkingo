import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:flutter_tts/flutter_tts.dart';
import '../../models/chat_message.dart';
import '../../providers/chat_provider.dart';
import '../../services/guard_chat_service.dart';
import '../../services/gemini_service.dart';
import '../../utils/theme.dart';
import '../../utils/plate_helpers.dart';
import 'guard_chat_thread_screen.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _textController = TextEditingController();
  final _scrollController = ScrollController();
  final _focusNode = FocusNode();

  final stt.SpeechToText _speech = stt.SpeechToText();
  final FlutterTts _tts = FlutterTts();
  bool _isListening = false;
  bool _speechAvailable = false;
  int? _ttsPlayingIndex;

  bool _voiceMode = false;
  bool _isSpeakingResponse = false;
  String _voiceTranscript = '';
  bool _wasTyping = false;
  String _sttLocale = 'en_US';
  String _ttsLang = 'en-US';
  List<stt.LocaleName> _availableLocales = [];
  ChatProvider? _chatProvider;

  @override
  void initState() {
    super.initState();
    _initSpeech();
    _initTts();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _chatProvider = context.read<ChatProvider>();
      _chatProvider!.addListener(_onChatUpdated);
    });
  }

  Future<void> _initSpeech() async {
    _speechAvailable = await _speech.initialize(
      onStatus: (status) {
        if (status == 'notListening' || status == 'done') {
          if (mounted) setState(() => _isListening = false);
        }
      },
      onError: (_) {
        if (mounted) setState(() => _isListening = false);
      },
    );
    if (_speechAvailable) {
      _availableLocales = await _speech.locales();
    }
    if (mounted) setState(() {});
  }

  void _setLanguage(String langCode) {
    setState(() {
      switch (langCode) {
        case 'fr':
          _sttLocale = _findLocale('fr') ?? 'fr_FR';
          _ttsLang = 'fr-FR';
          break;
        case 'ar':
          _sttLocale = _findLocale('ar') ?? 'ar_MA';
          _ttsLang = 'ar';
          break;
        default:
          _sttLocale = 'en_US';
          _ttsLang = 'en-US';
      }
    });
    _tts.setLanguage(_ttsLang);
  }

  String? _findLocale(String langPrefix) {
    final match = _availableLocales.where(
      (l) => l.localeId.startsWith(langPrefix),
    );
    return match.isNotEmpty ? match.first.localeId : null;
  }

  Future<void> _initTts() async {
    await _tts.setLanguage(_ttsLang);
    await _tts.setSpeechRate(0.5);
    await _tts.setVolume(1.0);
    _tts.setCompletionHandler(() {
      if (mounted) {
        setState(() {
          _ttsPlayingIndex = null;
          _isSpeakingResponse = false;
        });
        if (_voiceMode) {
          Future.delayed(const Duration(milliseconds: 500), () {
            if (mounted && _voiceMode && !_isListening) {
              _startListening();
            }
          });
        }
      }
    });
  }

  void _onChatUpdated() {
    if (!mounted || _chatProvider == null) return;
    final chat = _chatProvider!;

    if (_wasTyping && !chat.isTyping) {
      _wasTyping = false;
      if (_isSpeakingResponse) return;
      final messages = chat.messages;
      if (messages.isEmpty) return;
      final last = messages.last;
      if (last.isAssistant && !last.isError && last.content != '…' && last.type == MessageType.text) {
        _autoSpeak(last.content, messages.length - 1);
      }
    } else {
      _wasTyping = chat.isTyping;
    }
  }

  Future<void> _autoSpeak(String text, int index) async {
    final clean = _cleanForSpeech(text);
    if (clean.isEmpty) return;
    await _tts.setLanguage(_detectTtsLang(text));
    setState(() {
      _isSpeakingResponse = true;
      _ttsPlayingIndex = index;
    });
    await _tts.speak(clean);
  }

  String _detectTtsLang(String text) {
    if (RegExp(r'[\u0600-\u06FF]').hasMatch(text)) return 'ar';
    if (RegExp(r'[àâéèêëïîôùûüçœæ]', caseSensitive: false).hasMatch(text) ||
        RegExp(r'\b(je|vous|nous|est|sont|les|des|une|pas|pour|avec|votre|cette|parking)\b', caseSensitive: false).hasMatch(text)) {
      return 'fr-FR';
    }
    return _ttsLang;
  }

  String _cleanForSpeech(String text) {
    return text
        .replaceAll(RegExp(r'\*+'), '')
        .replaceAll(RegExp(r'[#>|`~]'), '')
        .replaceAll(RegExp(r'\[.*?\]\(.*?\)'), '')
        .replaceAll(RegExp(r'https?://\S+'), '')
        .replaceAll(RegExp(r'```[\s\S]*?```'), '')
        .replaceAll(RegExp(r'\n{2,}'), '. ')
        .replaceAll(RegExp(r'[-•]'), ',')
        .trim();
  }

  void _startListening() async {
    if (!_speechAvailable) return;
    await _tts.stop();
    setState(() {
      _isListening = true;
      _voiceTranscript = '';
      _ttsPlayingIndex = null;
      _isSpeakingResponse = false;
    });
    await _speech.listen(
      onResult: (result) {
        if (!mounted) return;
        setState(() => _voiceTranscript = result.recognizedWords);
        if (!_voiceMode) {
          _textController.text = result.recognizedWords;
          _textController.selection = TextSelection.collapsed(
            offset: _textController.text.length,
          );
        }
        if (result.finalResult) {
          setState(() => _isListening = false);
          final text = result.recognizedWords.trim();
          if (text.isNotEmpty) {
            if (_voiceMode) {
              context.read<ChatProvider>().sendMessage(text);
              _scrollToBottom();
            } else {
              _send();
            }
          }
        }
      },
      listenFor: const Duration(minutes: 2),
      pauseFor: const Duration(seconds: 10),
      localeId: _sttLocale,
    );
  }

  void _stopListening() async {
    await _speech.stop();
    if (mounted) setState(() => _isListening = false);
  }

  void _toggleVoiceMode() async {
    if (_voiceMode) {
      await _speech.stop();
      await _tts.stop();
      setState(() {
        _voiceMode = false;
        _isListening = false;
        _isSpeakingResponse = false;
        _voiceTranscript = '';
        _ttsPlayingIndex = null;
      });
    } else {
      setState(() => _voiceMode = true);
      _startListening();
    }
  }

  Future<void> _speak(String text, int index) async {
    if (_ttsPlayingIndex == index) {
      await _tts.stop();
      setState(() {
        _ttsPlayingIndex = null;
        _isSpeakingResponse = false;
      });
      return;
    }
    final clean = _cleanForSpeech(text);
    if (clean.isEmpty) return;
    await _tts.setLanguage(_detectTtsLang(text));
    setState(() => _ttsPlayingIndex = index);
    await _tts.speak(clean);
  }

  @override
  void dispose() {
    _chatProvider?.removeListener(_onChatUpdated);
    _speech.stop();
    _tts.stop();
    _textController.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _send() {
    final text = _textController.text.trim();
    if (text.isEmpty) return;
    _textController.clear();
    context.read<ChatProvider>().sendMessage(text);
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () {
            if (_voiceMode) _toggleVoiceMode();
            Navigator.pop(context);
          },
        ),
        title: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF6366F1), Color(0xFF9333EA)],
                ),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.smart_toy, color: Colors.white, size: 18),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('ParkBot AI',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                Text(
                  _voiceMode ? 'Voice mode active' : 'Powered by Gemini',
                  style: TextStyle(
                    fontSize: 10,
                    color: _voiceMode ? const Color(0xFF6366F1) : AppTheme.textSecondary,
                    fontWeight: _voiceMode ? FontWeight.w600 : FontWeight.normal,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.translate, size: 22),
            tooltip: 'Language',
            onSelected: _setLanguage,
            itemBuilder: (_) => [
              PopupMenuItem(
                value: 'en',
                child: Row(children: [
                  Text(_sttLocale.startsWith('en') ? '● ' : '   '),
                  const Text('English'),
                ]),
              ),
              PopupMenuItem(
                value: 'fr',
                child: Row(children: [
                  Text(_sttLocale.startsWith('fr') ? '● ' : '   '),
                  const Text('Français'),
                ]),
              ),
              PopupMenuItem(
                value: 'ar',
                child: Row(children: [
                  Text(_sttLocale.startsWith('ar') ? '● ' : '   '),
                  const Text('العربية'),
                ]),
              ),
            ],
          ),
          IconButton(
            icon: Icon(
              _voiceMode ? Icons.record_voice_over : Icons.voice_over_off,
              size: 22,
              color: _voiceMode ? const Color(0xFF6366F1) : null,
            ),
            onPressed: _toggleVoiceMode,
            tooltip: _voiceMode ? 'Exit voice mode' : 'Voice conversation',
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline, size: 22),
            onPressed: () {
              context.read<ChatProvider>().clearMessages();
            },
            tooltip: 'Clear chat',
          ),
        ],
      ),
      body: Stack(
        children: [
          Column(
            children: [
              Expanded(
                child: Consumer<ChatProvider>(
                  builder: (context, chat, _) {
                    _scrollToBottom();
                    if (!chat.hasMessages) return _buildEmptyState();

                    return ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                      itemCount: chat.messages.length + (chat.isTyping ? 1 : 0),
                      itemBuilder: (context, index) {
                        if (index == chat.messages.length && chat.isTyping) {
                          return _buildTypingIndicator();
                        }
                        final msg = chat.messages[index];
                        return _buildMessageItem(msg, index, chat);
                      },
                    );
                  },
                ),
              ),
              if (!_voiceMode) _buildInput(),
            ],
          ),
          if (_voiceMode) _buildVoiceModeOverlay(),
        ],
      ),
    );
  }

  // ─── Route message rendering by type ────────────────────────

  Widget _buildMessageItem(ChatMessage msg, int index, ChatProvider chat) {
    switch (msg.type) {
      case MessageType.parkingOptions:
        return _ParkingOptionsWidget(
          message: msg,
          onSelect: (option) {
            chat.selectParking(option);
            _scrollToBottom();
          },
          enabled: chat.bookingState == BookingState.awaitingParkingChoice,
        );
      case MessageType.timeSelection:
        return _TimeSelectionWidget(
          message: msg,
          onConfirm: (start, end) {
            chat.selectTime(start, end);
            _scrollToBottom();
          },
          enabled: chat.bookingState == BookingState.awaitingTimeSelection,
        );
      case MessageType.paymentConfirm:
        return _BookingSummaryWidget(
          key: ObjectKey(msg),
          message: msg,
          onConfirm: (vehiclePlate) {
            chat.confirmBooking(vehiclePlate);
            _scrollToBottom();
          },
          onCancel: () {
            chat.cancelBooking();
            _scrollToBottom();
          },
          enabled: chat.bookingState == BookingState.awaitingConfirmation,
        );
      case MessageType.guardChatCta:
        return _GuardChatCtaWidget(message: msg);
      case MessageType.text:
        return _MessageBubble(
          message: msg,
          isPlaying: _ttsPlayingIndex == index,
          onSpeak: msg.isAssistant && !msg.isError && msg.content != '…'
              ? () => _speak(msg.content, index)
              : null,
        );
    }
  }

  // ─── Voice mode overlay ─────────────────────────────────────

  Widget _buildVoiceModeOverlay() {
    return Positioned(
      left: 0,
      right: 0,
      bottom: 0,
      child: Container(
        padding: EdgeInsets.only(
          top: 24,
          bottom: MediaQuery.of(context).padding.bottom + 24,
        ),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.white.withAlpha(0),
              Colors.white.withAlpha(240),
              Colors.white,
            ],
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (_voiceTranscript.isNotEmpty && _isListening)
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceColor,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  _voiceTranscript,
                  style: const TextStyle(
                    fontSize: 16,
                    color: AppTheme.textPrimary,
                    fontWeight: FontWeight.w500,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            Text(
              _isSpeakingResponse
                  ? 'ParkBot is speaking...'
                  : _isListening
                      ? 'Listening...'
                      : 'Tap to speak',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: _isListening
                    ? Colors.red
                    : _isSpeakingResponse
                        ? const Color(0xFF6366F1)
                        : AppTheme.textSecondary,
              ),
            ),
            const SizedBox(height: 16),
            GestureDetector(
              onTap: () {
                if (_isSpeakingResponse) {
                  _tts.stop();
                  setState(() {
                    _isSpeakingResponse = false;
                    _ttsPlayingIndex = null;
                  });
                  Future.delayed(const Duration(milliseconds: 300), () {
                    if (mounted && _voiceMode) _startListening();
                  });
                } else if (_isListening) {
                  _stopListening();
                } else {
                  _startListening();
                }
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                width: _isListening ? 88 : 72,
                height: _isListening ? 88 : 72,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: _isSpeakingResponse
                        ? [const Color(0xFF6366F1), const Color(0xFF9333EA)]
                        : _isListening
                            ? [Colors.red.shade400, Colors.red.shade600]
                            : [const Color(0xFF6366F1), const Color(0xFF9333EA)],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: (_isListening ? Colors.red : const Color(0xFF6366F1))
                          .withAlpha(_isListening ? 100 : 60),
                      blurRadius: _isListening ? 30 : 20,
                      spreadRadius: _isListening ? 4 : 0,
                    ),
                  ],
                ),
                child: Icon(
                  _isSpeakingResponse
                      ? Icons.volume_up
                      : _isListening
                          ? Icons.stop
                          : Icons.mic,
                  color: Colors.white,
                  size: _isListening ? 36 : 32,
                ),
              ),
            ),
            const SizedBox(height: 12),
            TextButton(
              onPressed: _toggleVoiceMode,
              child: const Text(
                'Exit voice mode',
                style: TextStyle(
                  color: AppTheme.textSecondary,
                  fontSize: 13,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const SizedBox(height: 40),
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF6366F1), Color(0xFF9333EA)],
              ),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF6366F1).withAlpha(60),
                  blurRadius: 24,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: const Icon(Icons.smart_toy, color: Colors.white, size: 40),
          ),
          const SizedBox(height: 20),
          const Text(
            'Hi! I\'m ParkBot 🤖',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Your AI parking assistant for Marrakech.\nBook, pay, cancel — all through chat!',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: AppTheme.textSecondary,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 32),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            alignment: WrapAlignment.center,
            children: quickPrompts.map((p) {
              return GestureDetector(
                onTap: () {
                  context.read<ChatProvider>().sendMessage(p.text);
                  _scrollToBottom();
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppTheme.dividerColor),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withAlpha(8),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(p.icon, style: const TextStyle(fontSize: 16)),
                      const SizedBox(width: 6),
                      Text(
                        p.label,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12, right: 60),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppTheme.dividerColor),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(3, (i) {
            return TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: 1),
              duration: Duration(milliseconds: 600 + i * 200),
              builder: (context, value, child) {
                return Container(
                  margin: EdgeInsets.only(right: i < 2 ? 4 : 0),
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: AppTheme.textSecondary.withAlpha(100),
                    shape: BoxShape.circle,
                  ),
                );
              },
            );
          }),
        ),
      ),
    );
  }

  Widget _buildInput() {
    return Container(
      padding: EdgeInsets.only(
        left: 12,
        right: 8,
        top: 12,
        bottom: MediaQuery.of(context).padding.bottom + 12,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey.shade200)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (_isListening)
            Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.red.withAlpha(15),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.red.withAlpha(40)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'Listening...',
                    style: TextStyle(
                      color: Colors.red,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          Row(
            children: [
              IconButton(
                onPressed: _isListening ? _stopListening : _startListening,
                icon: Icon(
                  _isListening ? Icons.stop_circle : Icons.mic,
                  color: _isListening ? Colors.red : AppTheme.textSecondary,
                  size: 24,
                ),
                tooltip: _isListening ? 'Stop listening' : 'Voice input',
              ),
              Expanded(
                child: TextField(
                  controller: _textController,
                  focusNode: _focusNode,
                  textInputAction: TextInputAction.send,
                  onSubmitted: (_) => _send(),
                  maxLines: 4,
                  minLines: 1,
                  decoration: InputDecoration(
                    hintText: 'Ask ParkBot anything...',
                    hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
                    filled: true,
                    fillColor: AppTheme.surfaceColor,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24),
                      borderSide: BorderSide.none,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24),
                      borderSide: BorderSide.none,
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24),
                      borderSide: const BorderSide(color: Color(0xFF6366F1), width: 1.5),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Consumer<ChatProvider>(
                builder: (context, chat, _) {
                  return Container(
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF6366F1), Color(0xFF9333EA)],
                      ),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: IconButton(
                      onPressed: chat.isTyping ? null : _send,
                      icon: Icon(
                        chat.isTyping ? Icons.hourglass_top : Icons.send,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// INTERACTIVE WIDGETS
// ═══════════════════════════════════════════════════════════════

const _kPurple = Color(0xFF6366F1);
const _kGradient = LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF9333EA)]);

// ─── Parking Option Cards ─────────────────────────────────────

class _ParkingOptionsWidget extends StatelessWidget {
  final ChatMessage message;
  final void Function(ChatOption) onSelect;
  final bool enabled;

  const _ParkingOptionsWidget({
    required this.message,
    required this.onSelect,
    required this.enabled,
  });

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12, right: 20),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                gradient: _kGradient,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.smart_toy, color: Colors.white, size: 16),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(18),
                        topRight: Radius.circular(18),
                        bottomRight: Radius.circular(18),
                        bottomLeft: Radius.circular(4),
                      ),
                      border: Border.all(color: AppTheme.dividerColor),
                    ),
                    child: const Text(
                      'Which parking would you like to book?',
                      style: TextStyle(fontSize: 14, height: 1.5, color: AppTheme.textPrimary),
                    ),
                  ),
                  const SizedBox(height: 8),
                  ...message.options!.map((opt) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: enabled ? () => onSelect(opt) : null,
                          borderRadius: BorderRadius.circular(14),
                          child: AnimatedOpacity(
                            opacity: enabled ? 1.0 : 0.5,
                            duration: const Duration(milliseconds: 200),
                            child: Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(color: _kPurple.withAlpha(60)),
                                boxShadow: [
                                  BoxShadow(
                                    color: _kPurple.withAlpha(12),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    width: 40,
                                    height: 40,
                                    decoration: BoxDecoration(
                                      color: _kPurple.withAlpha(20),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: const Icon(Icons.local_parking, color: _kPurple, size: 22),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          opt.label,
                                          style: const TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w600,
                                            color: AppTheme.textPrimary,
                                          ),
                                        ),
                                        if (opt.subtitle != null) ...[
                                          const SizedBox(height: 2),
                                          Text(
                                            opt.subtitle!,
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: Colors.grey.shade600,
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                  if (enabled)
                                    Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey.shade400),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Time Selection Widget ────────────────────────────────────

class _TimeSelectionWidget extends StatefulWidget {
  final ChatMessage message;
  final void Function(DateTime start, DateTime end) onConfirm;
  final bool enabled;

  const _TimeSelectionWidget({
    required this.message,
    required this.onConfirm,
    required this.enabled,
  });

  @override
  State<_TimeSelectionWidget> createState() => _TimeSelectionWidgetState();
}

class _TimeSelectionWidgetState extends State<_TimeSelectionWidget> {
  late DateTime _startTime;
  int _durationHours = 1;

  @override
  void initState() {
    super.initState();
    final meta = widget.message.metadata ?? {};
    final defaultStr = meta['defaultStart'] as String?;
    if (defaultStr != null) {
      _startTime = DateTime.parse(defaultStr);
    } else {
      final now = DateTime.now().add(const Duration(minutes: 15));
      _startTime = DateTime(now.year, now.month, now.day, now.hour + 1, 0);
    }
  }

  double get _pricePerHour => (widget.message.metadata?['pricePerHour'] as num?)?.toDouble() ?? 0;
  double get _totalCost => _durationHours * _pricePerHour;

  String _fmtPrice(double v) => v == v.roundToDouble() ? '${v.toInt()}' : v.toStringAsFixed(1);

  Future<void> _pickStartTime() async {
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_startTime),
    );
    if (time != null) {
      setState(() {
        _startTime = DateTime(
          _startTime.year, _startTime.month, _startTime.day,
          time.hour, time.minute,
        );
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final meta = widget.message.metadata ?? {};
    final parkingName = meta['parkingName'] as String? ?? '';
    final slotNumber = meta['slotNumber'] as String? ?? '';
    final slotFloor = meta['slotFloor'] as String? ?? 'RDC';
    final slotType = meta['slotType'] as String? ?? 'STANDARD';
    final endTime = _startTime.add(Duration(hours: _durationHours));
    String pad(int v) => v.toString().padLeft(2, '0');

    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12, right: 20),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 28, height: 28,
              decoration: BoxDecoration(gradient: _kGradient, borderRadius: BorderRadius.circular(8)),
              child: const Icon(Icons.smart_toy, color: Colors.white, size: 16),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: AnimatedOpacity(
                opacity: widget.enabled ? 1.0 : 0.5,
                duration: const Duration(milliseconds: 200),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: _kPurple.withAlpha(50)),
                    boxShadow: [
                      BoxShadow(color: _kPurple.withAlpha(12), blurRadius: 10, offset: const Offset(0, 3)),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.schedule, color: _kPurple, size: 20),
                          const SizedBox(width: 8),
                          Text('Select reservation time',
                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.grey.shade800)),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text('$parkingName · Slot $slotNumber (Floor $slotFloor, $slotType)',
                          style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
                      const SizedBox(height: 16),

                      // Start time picker
                      GestureDetector(
                        onTap: widget.enabled ? _pickStartTime : null,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          decoration: BoxDecoration(
                            color: AppTheme.surfaceColor,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.grey.shade200),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.play_arrow_rounded, color: _kPurple, size: 20),
                              const SizedBox(width: 8),
                              Text('Start: ${pad(_startTime.hour)}:${pad(_startTime.minute)}',
                                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                              const Spacer(),
                              if (widget.enabled)
                                Icon(Icons.edit, size: 16, color: Colors.grey.shade400),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Duration selector
                      Text('Duration', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.grey.shade600)),
                      const SizedBox(height: 6),
                      Row(
                        children: [1, 2, 3, 4].map((hrs) {
                          final selected = _durationHours == hrs;
                          return Expanded(
                            child: GestureDetector(
                              onTap: widget.enabled ? () => setState(() => _durationHours = hrs) : null,
                              child: Container(
                                margin: EdgeInsets.only(right: hrs < 4 ? 6 : 0),
                                padding: const EdgeInsets.symmetric(vertical: 10),
                                decoration: BoxDecoration(
                                  gradient: selected ? _kGradient : null,
                                  color: selected ? null : AppTheme.surfaceColor,
                                  borderRadius: BorderRadius.circular(10),
                                  border: selected ? null : Border.all(color: Colors.grey.shade200),
                                ),
                                child: Text(
                                  '${hrs}h',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 14,
                                    color: selected ? Colors.white : Colors.grey.shade700,
                                  ),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 12),

                      // End time display
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        decoration: BoxDecoration(
                          color: AppTheme.surfaceColor,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.stop_rounded, color: Colors.redAccent, size: 20),
                            const SizedBox(width: 8),
                            Text('End: ${pad(endTime.hour)}:${pad(endTime.minute)}',
                                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Cost display
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: _kPurple.withAlpha(15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.monetization_on, color: _kPurple, size: 20),
                            const SizedBox(width: 8),
                            Text(
                              '${_fmtPrice(_totalCost)} MAD',
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: _kPurple),
                            ),
                            Text(
                              '  (${_fmtPrice(_pricePerHour)} × $_durationHours h)',
                              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),

                      if (widget.enabled)
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: () => widget.onConfirm(_startTime, endTime),
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              backgroundColor: _kPurple,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              elevation: 0,
                            ),
                            child: const Text('Continue', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Guard chat CTA (after successful booking) ───────────────

class _GuardChatCtaWidget extends StatelessWidget {
  final ChatMessage message;

  const _GuardChatCtaWidget({required this.message});

  @override
  Widget build(BuildContext context) {
    final m = message.metadata ?? {};
    final chatId = (m['chatId'] as num?)?.toInt();
    final parkingName = m['parkingName'] as String? ?? '';

    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12, right: 20),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                gradient: _kGradient,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.smart_toy, color: Colors.white, size: 16),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: const Color(0xFF34D399).withValues(alpha: 0.5),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      message.content,
                      style: const TextStyle(
                        fontSize: 13,
                        height: 1.35,
                        color: Color(0xFF064E3B),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    if (parkingName.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(
                        'Parking: $parkingName',
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.grey.shade700,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                    const SizedBox(height: 12),
                    if (chatId != null)
                      FilledButton.icon(
                        onPressed: () async {
                          final api = GuardChatService();
                          String peerName = 'Guard';
                          String? guardPhone;
                          try {
                            final chats = await api.listChats();
                            final c = chats.where((x) => x.id == chatId).toList();
                            if (c.isNotEmpty) {
                              peerName = c.first.peerFullName.isNotEmpty
                                  ? c.first.peerFullName
                                  : peerName;
                              guardPhone = c.first.guardPhone;
                            }
                          } catch (_) {}

                          if (!context.mounted) return;
                          Navigator.of(context).push(
                            MaterialPageRoute<void>(
                              builder: (_) => GuardChatThreadScreen(
                                chatId: chatId,
                                peerName: peerName,
                                parkingName: parkingName.isEmpty ? 'Parking' : parkingName,
                                guardPhone: guardPhone,
                              ),
                            ),
                          );
                        },
                        icon: const Icon(Icons.chat_bubble_outline, size: 20),
                        label: const Text('Chat'),
                        style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFF059669),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Booking Summary / Confirm Widget ─────────────────────────

class _BookingSummaryWidget extends StatefulWidget {
  final ChatMessage message;
  final void Function(String vehiclePlate) onConfirm;
  final VoidCallback onCancel;
  final bool enabled;

  const _BookingSummaryWidget({
    super.key,
    required this.message,
    required this.onConfirm,
    required this.onCancel,
    required this.enabled,
  });

  @override
  State<_BookingSummaryWidget> createState() => _BookingSummaryWidgetState();
}

class _BookingSummaryWidgetState extends State<_BookingSummaryWidget> {
  final TextEditingController _plateCtrl = TextEditingController();

  @override
  void dispose() {
    _plateCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final m = widget.message.metadata ?? {};
    final parkingName = m['parkingName'] as String? ?? '';
    final slotNumber = m['slotNumber'] as String? ?? '';
    final slotFloor = m['slotFloor'] as String? ?? '';
    final slotType = m['slotType'] as String? ?? '';
    final timeRange = m['timeRange'] as String? ?? '';
    final hours = m['hours'] as int? ?? 0;
    final cost = (m['cost'] as num?)?.toDouble() ?? 0;
    final balance = (m['walletBalance'] as num?)?.toDouble() ?? 0;
    final sufficient = m['sufficient'] as bool? ?? false;
    final plateOk = isValidVehiclePlate(_plateCtrl.text);

    String fmtPrice(double v) => v == v.roundToDouble() ? '${v.toInt()}' : v.toStringAsFixed(1);

    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12, right: 20),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 28, height: 28,
              decoration: BoxDecoration(gradient: _kGradient, borderRadius: BorderRadius.circular(8)),
              child: const Icon(Icons.smart_toy, color: Colors.white, size: 16),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: AnimatedOpacity(
                opacity: widget.enabled ? 1.0 : 0.5,
                duration: const Duration(milliseconds: 200),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: _kPurple.withAlpha(50)),
                    boxShadow: [
                      BoxShadow(color: _kPurple.withAlpha(12), blurRadius: 10, offset: const Offset(0, 3)),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.receipt_long, color: _kPurple, size: 20),
                          const SizedBox(width: 8),
                          const Text('Booking Summary',
                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                        ],
                      ),
                      const SizedBox(height: 14),
                      _summaryRow(Icons.local_parking, 'Parking', parkingName),
                      _summaryRow(Icons.space_dashboard, 'Slot', '$slotNumber (Floor $slotFloor, $slotType)'),
                      _summaryRow(Icons.schedule, 'Time', '$timeRange ($hours h)'),
                      if (widget.enabled) ...[
                        const SizedBox(height: 12),
                        TextField(
                          controller: _plateCtrl,
                          textCapitalization: TextCapitalization.characters,
                          onChanged: (_) => setState(() {}),
                          decoration: const InputDecoration(
                            labelText: 'Vehicle plate *',
                            hintText: 'e.g. 12345-A-6',
                            isDense: true,
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ],
                      const Divider(height: 20),
                      _summaryRow(Icons.monetization_on, 'Cost', '${fmtPrice(cost)} MAD'),
                      _summaryRow(Icons.account_balance_wallet, 'Wallet', '${fmtPrice(balance)} MAD',
                          valueColor: sufficient ? Colors.green : Colors.red),
                      if (!sufficient)
                        Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Text(
                            '⚠️ Insufficient balance — you need ${fmtPrice(cost - balance)} MAD more',
                            style: const TextStyle(fontSize: 12, color: Colors.red, fontWeight: FontWeight.w500),
                          ),
                        ),
                      const SizedBox(height: 16),
                      if (widget.enabled)
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton(
                                onPressed: widget.onCancel,
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                  side: BorderSide(color: Colors.grey.shade300),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                                child: const Text('Cancel', style: TextStyle(color: AppTheme.textSecondary)),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              flex: 2,
                              child: ElevatedButton(
                                onPressed: (!sufficient || !plateOk)
                                    ? null
                                    : () => widget.onConfirm(_plateCtrl.text.trim()),
                                style: ElevatedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                  backgroundColor: _kPurple,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  elevation: 0,
                                ),
                                child: const Text('Confirm Booking', style: TextStyle(fontWeight: FontWeight.w700)),
                              ),
                            ),
                          ],
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _summaryRow(IconData icon, String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.grey.shade500),
          const SizedBox(width: 8),
          Text('$label: ', style: TextStyle(fontSize: 13, color: Colors.grey.shade500)),
          Expanded(
            child: Text(
              value,
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: valueColor ?? AppTheme.textPrimary),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Standard Message Bubble ──────────────────────────────────

class _MessageBubble extends StatelessWidget {
  final ChatMessage message;
  final VoidCallback? onSpeak;
  final bool isPlaying;

  const _MessageBubble({
    required this.message,
    this.onSpeak,
    this.isPlaying = false,
  });

  @override
  Widget build(BuildContext context) {
    final isUser = message.isUser;

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: EdgeInsets.only(
          bottom: 12,
          left: isUser ? 60 : 0,
          right: isUser ? 0 : 60,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!isUser) ...[
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  gradient: _kGradient,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.smart_toy, color: Colors.white, size: 16),
              ),
              const SizedBox(width: 8),
            ],
            Flexible(
              child: Column(
                crossAxisAlignment:
                    isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: isUser
                          ? _kPurple
                          : message.isError
                              ? AppTheme.errorColor.withAlpha(15)
                              : Colors.white,
                      borderRadius: BorderRadius.only(
                        topLeft: const Radius.circular(18),
                        topRight: const Radius.circular(18),
                        bottomLeft: Radius.circular(isUser ? 18 : 4),
                        bottomRight: Radius.circular(isUser ? 4 : 18),
                      ),
                      border: isUser
                          ? null
                          : Border.all(
                              color: message.isError
                                  ? AppTheme.errorColor.withAlpha(40)
                                  : AppTheme.dividerColor,
                            ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withAlpha(8),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: SelectableText(
                      message.content,
                      style: TextStyle(
                        fontSize: 14,
                        height: 1.5,
                        color: isUser ? Colors.white : AppTheme.textPrimary,
                      ),
                    ),
                  ),
                  if (onSpeak != null)
                    GestureDetector(
                      onTap: onSpeak,
                      child: Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              isPlaying ? Icons.stop_circle : Icons.volume_up,
                              size: 16,
                              color: isPlaying ? _kPurple : AppTheme.textSecondary,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              isPlaying ? 'Stop' : 'Listen',
                              style: TextStyle(
                                fontSize: 11,
                                color: isPlaying ? _kPurple : AppTheme.textSecondary,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
