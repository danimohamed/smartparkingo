import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../models/guard_scan_result.dart';
import '../../services/guard_service.dart';
import 'guard_scan_result_screen.dart';

enum GuardScanMode { entry, exit }

class GuardScanScreen extends StatefulWidget {
  final GuardScanMode mode;

  const GuardScanScreen({super.key, required this.mode});

  @override
  State<GuardScanScreen> createState() => _GuardScanScreenState();
}

class _GuardScanScreenState extends State<GuardScanScreen> {
  final GuardService _guardService = GuardService();
  final MobileScannerController _controller = MobileScannerController();
  bool _handled = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _onBarcode(BarcodeCapture capture) async {
    if (_handled) return;
    final codes = capture.barcodes;
    if (codes.isEmpty) return;
    final raw = codes.first.rawValue;
    if (raw == null || raw.isEmpty) return;

    setState(() => _handled = true);
    await _controller.stop();

    GuardScanResult result;
    try {
      if (widget.mode == GuardScanMode.entry) {
        result = await _guardService.validateEntry(raw);
      } else {
        result = await _guardService.validateExit(raw);
      }
    } catch (e) {
      result = GuardScanResult(
        valid: false,
        message: e.toString(),
      );
    }

    if (!mounted) return;
    await Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (_) => GuardScanResultScreen(result: result),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final title =
        widget.mode == GuardScanMode.entry ? 'Scan — Entry' : 'Scan — Exit';
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Stack(
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: _onBarcode,
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 32,
            child: Center(
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  'Point the camera at the customer QR',
                  style: TextStyle(color: Colors.white),
                ),
              ),
            ),
          ),
          if (_handled)
            const ColoredBox(
              color: Colors.black26,
              child: Center(child: CircularProgressIndicator()),
            ),
        ],
      ),
    );
  }
}
