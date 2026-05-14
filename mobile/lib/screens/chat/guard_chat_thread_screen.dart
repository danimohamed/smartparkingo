import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'dart:convert';

import '../../models/guard_chat.dart';
import '../../services/call_invite_service.dart';
import '../../services/call_signaling_service.dart';
import '../../services/guard_chat_service.dart';
import '../../utils/theme.dart';
import 'guard_audio_call_screen.dart';

class GuardChatThreadScreen extends StatefulWidget {
  final int chatId;
  final String peerName;
  final String parkingName;
  final String? guardPhone;

  const GuardChatThreadScreen({
    super.key,
    required this.chatId,
    required this.peerName,
    required this.parkingName,
    this.guardPhone,
  });

  @override
  State<GuardChatThreadScreen> createState() => _GuardChatThreadScreenState();
}

class _GuardChatThreadScreenState extends State<GuardChatThreadScreen> {
  final GuardChatService _api = GuardChatService();
  final CallSignalingService _signaling = CallSignalingService();
  final CallInviteService _callInvite = CallInviteService();
  final TextEditingController _text = TextEditingController();
  final ScrollController _scroll = ScrollController();

  List<GuardChatMessage> _messages = [];
  bool _loading = true;
  bool _sending = false;
  String? _error;
  WebSocketChannel? _callChannel;
  bool _incomingDialogOpen = false;
  bool _inCall = false;

  @override
  void initState() {
    super.initState();
    _load();
    _initCallListener();
  }

  @override
  void dispose() {
    _callChannel?.sink.close();
    _text.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _initCallListener() async {
    try {
      _callChannel = await _signaling.connect(roomId: widget.chatId);
      _callChannel!.stream.listen((event) {
        _handleCallSignal(event);
      });
    } catch (_) {
      // Ignore call signaling errors; chat should still work.
    }
  }

  void _handleCallSignal(dynamic event) {
    if (!mounted) return;
    Map<String, dynamic> msg;
    try {
      msg = jsonDecode(event as String) as Map<String, dynamic>;
    } catch (_) {
      return;
    }
    final type = msg['type'] as String?;
    if (type == 'hangup') {
      // Caller cancelled before we answered → close the incoming dialog if open.
      if (_incomingDialogOpen) {
        Navigator.of(context, rootNavigator: true).pop();
        _incomingDialogOpen = false;
      }
      return;
    }

    if (type != 'invite') return;

    // If we're already in a call or already showing an incoming dialog, tell the caller we're busy.
    if (_inCall || _incomingDialogOpen) {
      _signaling.send({'type': 'busy'});
      return;
    }
    if (_incomingDialogOpen) return;
    _incomingDialogOpen = true;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Incoming call'),
        content: Text('Audio call from ${widget.peerName}.'),
        actions: [
          TextButton(
            onPressed: () {
              // Notify caller the call was rejected.
              _signaling.send({'type': 'reject'});
              Navigator.pop(ctx);
              _incomingDialogOpen = false;
            },
            child: const Text('Decline'),
          ),
          FilledButton(
            onPressed: () async {
              Navigator.pop(ctx);
              _incomingDialogOpen = false;
              _inCall = true;
              // Notify caller we're ready.
              _signaling.send({'type': 'accept'});
              if (!mounted) return;
              await Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => GuardAudioCallScreen(
                    roomId: widget.chatId,
                    peerName: widget.peerName,
                    isCaller: false,
                  ),
                ),
              );
              if (mounted) {
                setState(() => _inCall = false);
              } else {
                _inCall = false;
              }
            },
            child: const Text('Accept'),
          ),
        ],
      ),
    );
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await _api.getMessages(widget.chatId);
      if (mounted) {
        setState(() {
          _messages = list;
          _loading = false;
        });
        _scrollToEnd();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _send() async {
    final t = _text.text.trim();
    if (t.isEmpty || _sending) return;
    setState(() => _sending = true);
    try {
      final msg = await _api.sendMessage(widget.chatId, t);
      _text.clear();
      if (mounted) {
        setState(() {
          _messages = [..._messages, msg];
          _sending = false;
        });
        _scrollToEnd();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _sending = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    }
  }

  String _sanitizePhone(String raw) {
    return raw.replaceAll(RegExp(r'[^0-9+]'), '');
  }

  Future<void> _startRegularCall() async {
    final raw = (widget.guardPhone ?? '').trim();
    if (raw.isEmpty) return;
    final phone = _sanitizePhone(raw);
    final uri = Uri(scheme: 'tel', path: phone);
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Future<void> _startFreeCall() async {
    // In-app audio call via WebRTC.
    if (_inCall || _incomingDialogOpen) return;
    // Notify peer even if they are not in the chat (push invite).
    try {
      await _callInvite.sendInvitePush(widget.chatId);
    } catch (_) {
      // Best-effort.
    }
    _signaling.send({'type': 'invite'});
    if (!mounted) return;
    setState(() => _inCall = true);
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => GuardAudioCallScreen(
          roomId: widget.chatId,
          peerName: widget.peerName,
          isCaller: true,
        ),
      ),
    );
    if (mounted) {
      setState(() => _inCall = false);
    } else {
      _inCall = false;
    }
  }

  Future<void> _showCallOptions() async {
    final choice = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      backgroundColor: AppTheme.surfaceColor,
      builder: (ctx) {
        final phone = _sanitizePhone((widget.guardPhone ?? '').trim());
        final hasPhone = phone.isNotEmpty;
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ListTile(
                  leading: const Icon(Icons.wifi_calling_3),
                  title: const Text('Free call'),
                  subtitle: const Text('In-app audio call (WiFi / data)'),
                  onTap: () => Navigator.pop(ctx, 'free'),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.phone),
                  title: const Text('Regular call'),
                  subtitle: Text(hasPhone ? 'Call $phone' : 'Guard phone number not available'),
                  enabled: hasPhone,
                  onTap: hasPhone ? () => Navigator.pop(ctx, 'regular') : null,
                ),
              ],
            ),
          ),
        );
      },
    );

    if (!mounted || choice == null) return;
    if (choice == 'free') {
      await _startFreeCall();
    } else if (choice == 'regular') {
      await _startRegularCall();
    }
  }

  @override
  Widget build(BuildContext context) {
    final timeFmt = DateFormat.Hm();
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.peerName, style: const TextStyle(fontSize: 16)),
            Text(
              widget.parkingName,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.normal,
                color: Colors.white70,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Call',
            icon: const Icon(Icons.phone),
            onPressed: _showCallOptions,
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(_error!,
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(color: AppTheme.errorColor)),
                              const SizedBox(height: 12),
                              FilledButton(
                                onPressed: _load,
                                child: const Text('Retry'),
                              ),
                            ],
                          ),
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: ListView.builder(
                          controller: _scroll,
                          padding: const EdgeInsets.all(12),
                          itemCount: _messages.length,
                          itemBuilder: (context, i) {
                            final m = _messages[i];
                            if (m.systemMessage) {
                              return Padding(
                                padding: const EdgeInsets.symmetric(vertical: 6),
                                child: Center(
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 12, vertical: 8),
                                    decoration: BoxDecoration(
                                      color: AppTheme.textSecondary.withAlpha(30),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      m.body,
                                      textAlign: TextAlign.center,
                                      style: const TextStyle(fontSize: 12),
                                    ),
                                  ),
                                ),
                              );
                            }
                            final align = m.fromMe
                                ? Alignment.centerRight
                                : Alignment.centerLeft;
                            final bg = m.fromMe
                                ? AppTheme.primaryColor
                                : Colors.grey.shade200;
                            final fg = m.fromMe ? Colors.white : AppTheme.textPrimary;
                            return Align(
                              alignment: align,
                              child: ConstrainedBox(
                                constraints: BoxConstraints(
                                  maxWidth: MediaQuery.of(context).size.width * 0.82,
                                ),
                                child: Container(
                                  margin: const EdgeInsets.only(bottom: 8),
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 12, vertical: 10),
                                  decoration: BoxDecoration(
                                    color: bg,
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      if (!m.fromMe &&
                                          (m.senderFullName?.isNotEmpty ?? false))
                                        Padding(
                                          padding: const EdgeInsets.only(bottom: 4),
                                          child: Text(
                                            m.senderFullName!,
                                            style: TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.w600,
                                              color: fg.withAlpha(200),
                                            ),
                                          ),
                                        ),
                                      Text(m.body, style: TextStyle(color: fg)),
                                      if (m.createdAt != null)
                                        Padding(
                                          padding: const EdgeInsets.only(top: 4),
                                          child: Text(
                                            timeFmt.format(m.createdAt!.toLocal()),
                                            style: TextStyle(
                                              fontSize: 10,
                                              color: fg.withAlpha(180),
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(8, 0, 8, 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Expanded(
                    child: TextField(
                      controller: _text,
                      minLines: 1,
                      maxLines: 4,
                      textCapitalization: TextCapitalization.sentences,
                      decoration: InputDecoration(
                        hintText: 'Message…',
                        filled: true,
                        fillColor: Colors.grey.shade100,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(20),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 10,
                        ),
                      ),
                      onSubmitted: (_) => _send(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    style: IconButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      foregroundColor: Colors.white,
                    ),
                    onPressed: _sending ? null : _send,
                    icon: _sending
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.send),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
