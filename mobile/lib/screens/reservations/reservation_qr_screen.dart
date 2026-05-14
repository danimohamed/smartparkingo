import 'dart:async';

import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../services/reservation_service.dart';
import '../../utils/theme.dart';

class ReservationQrScreen extends StatefulWidget {
  final int reservationId;

  const ReservationQrScreen({super.key, required this.reservationId});

  @override
  State<ReservationQrScreen> createState() => _ReservationQrScreenState();
}

class _ReservationQrScreenState extends State<ReservationQrScreen> {
  final ReservationService _service = ReservationService();
  String? _qrData;
  String? _error;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _load();
    _timer = Timer.periodic(const Duration(seconds: 30), (_) => _load());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final data = await _service.getQrToken(widget.reservationId);
      if (mounted) {
        setState(() {
          _qrData = data;
          _error = null;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _error = e.toString());
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Entry QR'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const Text(
                'Show this code at the parking gate. It refreshes every 30 seconds.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppTheme.textSecondary, fontSize: 14),
              ),
              const SizedBox(height: 24),
              Expanded(
                child: Center(
                  child: _buildQr(),
                ),
              ),
              Text(
                'Reservation #${widget.reservationId}',
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQr() {
    if (_error != null) {
      return Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.error_outline, color: AppTheme.errorColor, size: 48),
          const SizedBox(height: 12),
          Text(_error!, textAlign: TextAlign.center),
          const SizedBox(height: 16),
          TextButton(onPressed: _load, child: const Text('Retry')),
        ],
      );
    }
    final data = _qrData;
    if (data == null || data.isEmpty) {
      return const CircularProgressIndicator();
    }
    return QrImageView(
      data: data,
      version: QrVersions.auto,
      size: 280,
      backgroundColor: Colors.white,
      eyeStyle: const QrEyeStyle(
        eyeShape: QrEyeShape.square,
        color: AppTheme.textPrimary,
      ),
      dataModuleStyle: const QrDataModuleStyle(
        dataModuleShape: QrDataModuleShape.square,
        color: AppTheme.textPrimary,
      ),
    );
  }
}
