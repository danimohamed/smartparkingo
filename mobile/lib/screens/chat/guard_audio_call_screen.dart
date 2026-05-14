import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

import '../../services/call_signaling_service.dart';
import '../../utils/theme.dart';

class GuardAudioCallScreen extends StatefulWidget {
  final int roomId; // chatId
  final String peerName;
  final bool isCaller;

  const GuardAudioCallScreen({
    super.key,
    required this.roomId,
    required this.peerName,
    required this.isCaller,
  });

  @override
  State<GuardAudioCallScreen> createState() => _GuardAudioCallScreenState();
}

class _GuardAudioCallScreenState extends State<GuardAudioCallScreen> {
  final CallSignalingService _signaling = CallSignalingService();
  WebSocketChannel? _channel;

  RTCPeerConnection? _pc;
  MediaStream? _localStream;

  bool _connecting = true;
  bool _connected = false;
  bool _muted = false;
  String? _status;
  Timer? _ringTimeout;

  StreamSubscription? _sub;

  @override
  void initState() {
    super.initState();
    _start();
  }

  @override
  void dispose() {
    _sub?.cancel();
    _ringTimeout?.cancel();
    _hangup(send: false);
    super.dispose();
  }

  Future<void> _start() async {
    setState(() {
      _connecting = true;
      _status = widget.isCaller ? 'Calling…' : 'Connecting…';
    });

    try {
      _channel = await _signaling.connect(roomId: widget.roomId);
      _sub = _channel!.stream.listen(_onSignalMessage, onError: (_) {});

      await _initPeerConnection();

      // Caller waits for callee accept (sent from thread screen) then creates offer.
      if (!widget.isCaller) {
        // Callee: let others know we’re ready.
        _signaling.send({'type': 'ready'});
      } else {
        // Caller: if nobody accepts within 30s, end as missed.
        _ringTimeout?.cancel();
        _ringTimeout = Timer(const Duration(seconds: 30), () async {
          if (!mounted) return;
          if (_connected) return;
          setState(() => _status = 'No answer');
          await Future.delayed(const Duration(milliseconds: 700));
          await _hangup(send: true);
          if (!mounted) return;
          Navigator.of(context).pop();
        });
      }

      setState(() => _connecting = false);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _connecting = false;
        _status = 'Failed to start call';
      });
    }
  }

  Future<void> _initPeerConnection() async {
    final config = <String, dynamic>{
      'iceServers': [
        {'urls': 'stun:stun.l.google.com:19302'},
      ],
    };
    _pc = await createPeerConnection(config);

    _pc!.onIceCandidate = (c) {
      if (c.candidate == null) return;
      _signaling.send({
        'type': 'ice',
        'candidate': {
          'candidate': c.candidate,
          'sdpMid': c.sdpMid,
          'sdpMLineIndex': c.sdpMLineIndex,
        },
      });
    };

    _pc!.onConnectionState = (s) {
      if (!mounted) return;
      setState(() {
        _connected = s == RTCPeerConnectionState.RTCPeerConnectionStateConnected;
        _status = _connected ? 'Connected' : _status;
      });
    };

    _localStream = await navigator.mediaDevices.getUserMedia({
      'audio': true,
      'video': false,
    });
    for (final t in _localStream!.getTracks()) {
      await _pc!.addTrack(t, _localStream!);
    }
  }

  Future<void> _createAndSendOffer() async {
    if (_pc == null) return;
    _ringTimeout?.cancel();
    final offer = await _pc!.createOffer({
      'offerToReceiveAudio': 1,
      'offerToReceiveVideo': 0,
    });
    await _pc!.setLocalDescription(offer);
    _signaling.send({'type': 'offer', 'sdp': offer.sdp});
    if (mounted) setState(() => _status = 'Ringing…');
  }

  Future<void> _onSignalMessage(dynamic data) async {
    if (_pc == null) return;
    Map<String, dynamic> msg;
    try {
      msg = jsonDecode(data as String) as Map<String, dynamic>;
    } catch (_) {
      return;
    }
    final type = msg['type'] as String?;
    if (type == null) return;

    switch (type) {
      case 'accept':
        if (widget.isCaller) {
          await _createAndSendOffer();
        }
        break;
      case 'reject':
        if (widget.isCaller) {
          _ringTimeout?.cancel();
          if (mounted) setState(() => _status = 'Declined');
          await Future.delayed(const Duration(milliseconds: 700));
          await _hangup(send: false);
          if (!mounted) return;
          Navigator.of(context).pop();
        }
        break;
      case 'busy':
        if (widget.isCaller) {
          _ringTimeout?.cancel();
          if (mounted) setState(() => _status = 'User busy');
          await Future.delayed(const Duration(milliseconds: 700));
          await _hangup(send: false);
          if (!mounted) return;
          Navigator.of(context).pop();
        }
        break;
      case 'ready':
        // No-op; reserved for future.
        break;
      case 'offer':
        if (widget.isCaller) break;
        final sdp = msg['sdp'] as String?;
        if (sdp == null) break;
        await _pc!.setRemoteDescription(RTCSessionDescription(sdp, 'offer'));
        final answer = await _pc!.createAnswer({
          'offerToReceiveAudio': 1,
          'offerToReceiveVideo': 0,
        });
        await _pc!.setLocalDescription(answer);
        _signaling.send({'type': 'answer', 'sdp': answer.sdp});
        if (mounted) setState(() => _status = 'Connecting…');
        break;
      case 'answer':
        if (!widget.isCaller) break;
        final sdp = msg['sdp'] as String?;
        if (sdp == null) break;
        await _pc!.setRemoteDescription(RTCSessionDescription(sdp, 'answer'));
        if (mounted) setState(() => _status = 'Connecting…');
        break;
      case 'ice':
        final cand = msg['candidate'] as Map<String, dynamic>?;
        if (cand == null) break;
        final c = RTCIceCandidate(
          cand['candidate'] as String?,
          cand['sdpMid'] as String?,
          cand['sdpMLineIndex'] as int?,
        );
        await _pc!.addCandidate(c);
        break;
      case 'hangup':
        _ringTimeout?.cancel();
        if (mounted) Navigator.pop(context);
        break;
    }
  }

  Future<void> _toggleMute() async {
    final s = _localStream;
    if (s == null) return;
    final enabled = _muted;
    for (final t in s.getAudioTracks()) {
      t.enabled = enabled;
    }
    setState(() => _muted = !_muted);
  }

  Future<void> _hangup({bool send = true}) async {
    _ringTimeout?.cancel();
    if (send) {
      _signaling.send({'type': 'hangup'});
    }
    try {
      await _localStream?.dispose();
    } catch (_) {}
    try {
      await _pc?.close();
    } catch (_) {}
    _localStream = null;
    _pc = null;
    await _signaling.close();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.surfaceColor,
      appBar: AppBar(
        title: Text(widget.peerName),
        actions: [
          IconButton(
            tooltip: _muted ? 'Unmute' : 'Mute',
            icon: Icon(_muted ? Icons.mic_off : Icons.mic),
            onPressed: _toggleMute,
          ),
          IconButton(
            tooltip: 'Hang up',
            icon: const Icon(Icons.call_end),
            onPressed: () async {
              final nav = Navigator.of(context);
              await _hangup(send: true);
              if (!mounted) return;
              nav.pop();
            },
          ),
        ],
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                _connected ? Icons.call : Icons.ring_volume,
                size: 56,
                color: _connected ? AppTheme.primaryColor : AppTheme.textSecondary,
              ),
              const SizedBox(height: 12),
              Text(
                _status ?? '',
                style: const TextStyle(fontSize: 16, color: AppTheme.textSecondary),
              ),
              if (widget.isCaller && !_connected) ...[
                const SizedBox(height: 18),
                FilledButton.icon(
                  onPressed: () async {
                    final nav = Navigator.of(context);
                    await _hangup(send: true);
                    if (!mounted) return;
                    nav.pop();
                  },
                  icon: const Icon(Icons.close),
                  label: const Text('Cancel'),
                ),
              ],
              if (_connecting) ...[
                const SizedBox(height: 16),
                const CircularProgressIndicator(),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

