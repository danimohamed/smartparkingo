import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../models/guard_scan_result.dart';
import '../../models/reservation.dart';
import '../../models/walk_in_session.dart';
import '../../models/guard_plate_scan_flow_result.dart';
import '../../providers/auth_provider.dart';
import '../../services/guard_service.dart';
import '../../utils/helpers.dart';
import '../../utils/theme.dart';
import '../auth/login_screen.dart';
import '../chat/guard_chats_list_screen.dart';
import 'guard_scan_result_screen.dart';
import 'guard_plate_scan_screen.dart';
import 'guard_scan_screen.dart';

class GuardHomeScreen extends StatefulWidget {
  const GuardHomeScreen({super.key});

  @override
  State<GuardHomeScreen> createState() => _GuardHomeScreenState();
}

class _GuardHomeScreenState extends State<GuardHomeScreen> {
  final GuardService _guard = GuardService();
  List<Reservation> _bookings = [];
  List<WalkInSession> _walkIns = [];
  bool _loading = true;
  String? _listError;
  int _appUsersToday = 0;
  int _nonAppUsersToday = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _bootstrap());
  }

  Future<void> _bootstrap() async {
    final auth = context.read<AuthProvider>();
    if (auth.user?.assignedParkingId == null) {
      try {
        await auth.refreshProfile();
      } catch (_) {}
    }
    await _loadBookings();
  }

  int? get _parkingId => context.read<AuthProvider>().user?.assignedParkingId;

  Future<void> _loadBookings() async {
    final pid = _parkingId;
    if (pid == null) {
      setState(() {
        _loading = false;
        _listError = 'No parking assigned. Ask an admin to assign your account.';
        _bookings = [];
      });
      return;
    }
    setState(() {
      _loading = true;
      _listError = null;
    });
    try {
      final list = await _guard.activeBookingsForParking(pid);
      List<WalkInSession> walk = [];
      try {
        walk = await _guard.activeWalkIns(pid);
      } catch (_) {}
      int app = 0;
      int nonApp = 0;
      try {
        final stats = await _guard.getTodayPlateScanStats(pid);
        app = stats.appUsersToday;
        nonApp = stats.nonAppUsersToday;
      } catch (_) {}
      if (mounted) {
        setState(() {
          _bookings = list;
          _walkIns = walk;
          _appUsersToday = app;
          _nonAppUsersToday = nonApp;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _listError = e.toString();
          _loading = false;
        });
      }
    }
  }

  Future<void> _openScan(GuardScanMode mode) async {
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => GuardScanScreen(mode: mode)),
    );
  }

  Future<void> _manual(GuardScanMode mode) async {
    final ctrl = TextEditingController();
    final id = await showDialog<int>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(
            mode == GuardScanMode.entry ? 'Manual entry' : 'Manual exit'),
        content: TextField(
          controller: ctrl,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(
            labelText: 'Reservation ID',
            hintText: 'e.g. 42',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final v = int.tryParse(ctrl.text.trim());
              if (v != null) Navigator.pop(ctx, v);
            },
            child: const Text('Verify'),
          ),
        ],
      ),
    );
    if (id == null || !mounted) return;

    GuardScanResult result;
    try {
      if (mode == GuardScanMode.entry) {
        result = await _guard.validateEntryManual(id);
      } else {
        result = await _guard.validateExitManual(id);
      }
    } catch (e) {
      result = GuardScanResult(valid: false, message: e.toString());
    }
    if (!mounted) return;
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => GuardScanResultScreen(result: result),
      ),
    );
  }

  Future<void> _plateEntry() async {
    final pid = _parkingId;
    if (pid == null) return;
    final plateCtrl = TextEditingController();
    final slotCtrl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Plate entry (walk-in or app match)'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: plateCtrl,
                decoration: const InputDecoration(
                  labelText: 'License plate',
                  hintText: 'e.g. 12345-A-6',
                ),
                textCapitalization: TextCapitalization.characters,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: slotCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Slot ID (optional)',
                  hintText: 'Leave empty if unknown',
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Submit'),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    final plate = plateCtrl.text.trim();
    if (plate.isEmpty) return;
    final slotId = int.tryParse(slotCtrl.text.trim());
    try {
      final map = await _guard.plateEntry(
        parkingId: pid,
        plate: plate,
        parkingSlotId: slotId,
      );
      final success = map['success'] as bool? ?? false;
      final msg = map['message'] as String? ?? '';
      final outcome = map['outcome'] as String? ?? '';
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(success ? '$outcome: $msg' : msg),
            backgroundColor:
                success ? AppTheme.accentColor : AppTheme.errorColor,
          ),
        );
        await _loadBookings();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString()),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  Future<void> _plateExit() async {
    final pid = _parkingId;
    if (pid == null) return;
    final plateCtrl = TextEditingController();
    var paidCash = false;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setLocal) => AlertDialog(
          title: const Text('Plate exit'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: plateCtrl,
                decoration: const InputDecoration(
                  labelText: 'License plate',
                ),
                textCapitalization: TextCapitalization.characters,
              ),
              CheckboxListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Paid cash on exit'),
                value: paidCash,
                onChanged: (v) => setLocal(() => paidCash = v ?? false),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Submit'),
            ),
          ],
        ),
      ),
    );
    if (ok != true || !mounted) return;
    final plate = plateCtrl.text.trim();
    if (plate.isEmpty) return;
    try {
      final map = await _guard.plateExit(
        parkingId: pid,
        plate: plate,
        paidOnExit: paidCash,
      );
      final success = map['success'] as bool? ?? false;
      final msg = map['message'] as String? ?? '';
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(msg),
            backgroundColor:
                success ? AppTheme.accentColor : AppTheme.errorColor,
          ),
        );
        await _loadBookings();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString()),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  Future<void> _manualSlot({required bool occupy}) async {
    final ctrl = TextEditingController();
    final id = await showDialog<int>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(occupy ? 'Mark slot occupied' : 'Free manual slot'),
        content: TextField(
          controller: ctrl,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(
            labelText: 'Slot ID',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final v = int.tryParse(ctrl.text.trim());
              if (v != null) Navigator.pop(ctx, v);
            },
            child: const Text('Submit'),
          ),
        ],
      ),
    );
    if (id == null || !mounted) return;
    try {
      if (occupy) {
        await _guard.manualOccupySlot(id);
      } else {
        await _guard.manualFreeSlot(id);
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(occupy ? 'Slot marked occupied' : 'Slot freed'),
            backgroundColor: AppTheme.accentColor,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString()),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final u = auth.user;
    final parkingLabel = u?.assignedParkingName ?? 'Parking';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Guard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh bookings',
            onPressed: _loading ? null : _loadBookings,
          ),
          IconButton(
            icon: const Icon(Icons.chat_bubble_outline),
            tooltip: 'Guard chats',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const GuardChatsListScreen(),
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await auth.logout();
              if (context.mounted) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (_) => false,
                );
              }
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadBookings,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              u?.fullName ?? '',
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              parkingLabel,
              style: const TextStyle(color: AppTheme.textSecondary),
            ),
            if (_parkingId != null)
              Text(
                'Parking ID: $_parkingId',
                style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
              ),
            if (_parkingId != null) ...[
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.green.withAlpha(18),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: Colors.green.withAlpha(50)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'App users today',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppTheme.textSecondary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            '$_appUsersToday',
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.red.withAlpha(18),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: Colors.red.withAlpha(50)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Non-app users today',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppTheme.textSecondary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            '$_nonAppUsersToday',
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 28),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton.icon(
                onPressed: () => _openScan(GuardScanMode.entry),
                icon: const Icon(Icons.login),
                label: const Text('SCAN ENTRY'),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.secondaryColor,
                ),
                onPressed: () => _openScan(GuardScanMode.exit),
                icon: const Icon(Icons.logout),
                label: const Text('SCAN EXIT'),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _manual(GuardScanMode.entry),
                    child: const Text('Manual entry'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _manual(GuardScanMode.exit),
                    child: const Text('Manual exit'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _manualSlot(occupy: true),
                    child: const Text('Occupy slot'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _manualSlot(occupy: false),
                    child: const Text('Free slot'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _parkingId == null ? null : _plateEntry,
                    icon: const Icon(Icons.directions_car, size: 18),
                    label: const Text('Plate entry'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _parkingId == null ? null : _plateExit,
                    icon: const Icon(Icons.exit_to_app, size: 18),
                    label: const Text('Plate exit'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: _parkingId == null
                    ? null
                    : () async {
                        final source = await showModalBottomSheet<ImageSource>(
                          context: context,
                          showDragHandle: true,
                          builder: (ctx) => SafeArea(
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  const Text(
                                    'Scan vehicle plate',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  const Text(
                                    'Choose how you want to provide the plate image.',
                                    style: TextStyle(color: AppTheme.textSecondary),
                                  ),
                                  const SizedBox(height: 16),
                                  ElevatedButton.icon(
                                    onPressed: () => Navigator.pop(ctx, ImageSource.camera),
                                    icon: const Icon(Icons.camera_alt),
                                    label: const Text('Scan using camera'),
                                  ),
                                  const SizedBox(height: 10),
                                  OutlinedButton.icon(
                                    onPressed: () => Navigator.pop(ctx, ImageSource.gallery),
                                    icon: const Icon(Icons.photo_library),
                                    label: const Text('Upload a photo'),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                        if (!context.mounted || source == null) return;
                        final result = await Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => GuardPlateScanScreen(source: source),
                          ),
                        );
                        if (!context.mounted) return;
                        if (result is GuardPlateScanFlowResult) {
                          setState(() {
                            _appUsersToday = result.appUsersToday;
                            _nonAppUsersToday = result.nonAppUsersToday;
                          });
                        }
                        await _loadBookings();
                      },
                icon: const Icon(Icons.camera_alt, size: 18),
                label: const Text('Scan plate'),
              ),
            ),
            const SizedBox(height: 28),
            const Text(
              'Active walk-ins (plate)',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            if (_walkIns.isEmpty)
              const Padding(
                padding: EdgeInsets.only(bottom: 16),
                child: Text(
                  'None',
                  style: TextStyle(color: AppTheme.textSecondary),
                ),
              )
            else
              ..._walkIns.map(_walkInTile),
            const SizedBox(height: 16),
            const Text(
              "Today's bookings",
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            if (_listError != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(
                  _listError!,
                  style: const TextStyle(color: AppTheme.errorColor),
                ),
              ),
            if (_loading)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_bookings.isEmpty && _listError == null)
              const Padding(
                padding: EdgeInsets.all(16),
                child: Text('No active bookings for today.'),
              )
            else
              ..._bookings.map(_bookingTile),
          ],
        ),
      ),
    );
  }

  Widget _walkInTile(WalkInSession w) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        title: Text(w.plateNormalized),
        subtitle: Text(
          w.slotNumber != null ? 'Slot ${w.slotNumber}' : 'No slot linked',
        ),
        trailing: Text(
          w.status,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }

  Widget _bookingTile(Reservation r) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        title: Text('${r.parkingName} · ${r.slotNumber}'),
        subtitle: Text(
          '${Helpers.formatTime(r.startTime)} – ${Helpers.formatTime(r.endTime)} · ${r.userFullName}',
        ),
        trailing: Text(
          Helpers.reservationStatusLabel(r.status),
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }
}
