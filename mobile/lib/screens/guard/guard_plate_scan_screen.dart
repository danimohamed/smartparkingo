import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../models/guard_plate_scan_flow_result.dart';
import '../../providers/auth_provider.dart';
import '../../services/guard_service.dart';
import '../../utils/theme.dart';

class GuardPlateScanScreen extends StatefulWidget {
  final ImageSource source;

  const GuardPlateScanScreen({
    super.key,
    required this.source,
  });

  @override
  State<GuardPlateScanScreen> createState() => _GuardPlateScanScreenState();
}

class _GuardPlateScanScreenState extends State<GuardPlateScanScreen> {
  final GuardService _guard = GuardService();
  final ImagePicker _picker = ImagePicker();
  bool _loading = false;
  String? _status;
  String? _plate;
  String? _message;
  bool? _found;
  int? _appUsersToday;
  int? _nonAppUsersToday;

  int? get _parkingId => context.read<AuthProvider>().user?.assignedParkingId;

  bool get _isCamera => widget.source == ImageSource.camera;

  String get _sourceLabel => _isCamera ? 'camera' : 'photo library';

  Future<void> _scan() async {
    final pid = _parkingId;
    if (pid == null) {
      setState(() {
        _status = 'No parking assigned to this guard account.';
      });
      return;
    }

    final img = await _picker.pickImage(
      source: widget.source,
      imageQuality: 90,
      maxWidth: 1600,
    );
    if (img == null) return;

    setState(() {
      _loading = true;
      _status = 'Reading plate…';
      _plate = null;
      _message = null;
      _found = null;
      _appUsersToday = null;
      _nonAppUsersToday = null;
    });

    try {
      final GuardPlateScanFlowResult r = await _guard.scanPlateFlow(
        parkingId: pid,
        filePath: img.path,
        filename: img.name.isNotEmpty ? img.name : 'plate.jpg',
      );
      setState(() {
        _loading = false;
        _plate = r.plate;
        _found = r.appUser;
        _message = r.message;
        _status = r.appUser ? 'APP booking found' : 'No app booking found';
        _appUsersToday = r.appUsersToday;
        _nonAppUsersToday = r.nonAppUsersToday;
      });
    } catch (e) {
      setState(() {
        _loading = false;
        _status = 'Error';
        _message = e.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_isCamera ? 'Scan plate' : 'Upload plate')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppTheme.dividerColor),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _status ?? 'Use the $_sourceLabel to read the vehicle plate.',
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  if (_plate != null) ...[
                    const SizedBox(height: 8),
                    Text('Plate: $_plate', style: const TextStyle(fontSize: 14)),
                  ],
                  if (_message != null && _message!.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(_message!, style: const TextStyle(color: AppTheme.textSecondary)),
                  ],
                  if (_found != null) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: (_found! ? Colors.green : Colors.red).withAlpha(18),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: (_found! ? Colors.green : Colors.red).withAlpha(60),
                        ),
                      ),
                      child: Text(
                        _found!
                            ? '✅ This plate has an ACTIVE booking today (app user).'
                            : '❌ No ACTIVE booking today for this plate (not from app).',
                        style: TextStyle(
                          color: _found! ? Colors.green.shade800 : Colors.red.shade800,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                  if (_appUsersToday != null && _nonAppUsersToday != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      'Today counters — App users: $_appUsersToday | Non-app users: $_nonAppUsersToday',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppTheme.textSecondary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _loading ? null : _scan,
              icon: Icon(_isCamera ? Icons.camera_alt : Icons.photo_library),
              label: _loading
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : Text(_isCamera ? 'Open camera & scan' : 'Choose image & scan'),
            ),
            const SizedBox(height: 10),
            Text(
              'Note: OCR requires the backend ALPR service to be configured. If OCR is disabled, you can still use manual plate entry in the guard tools.',
              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
            ),
          ],
        ),
      ),
    );
  }
}

