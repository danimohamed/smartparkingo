import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/parking.dart';
import '../models/parking_slot.dart';
import '../providers/reservation_provider.dart';
import '../utils/theme.dart';
import '../utils/helpers.dart';
import '../utils/plate_helpers.dart';
import '../services/user_service.dart';

class ReservationBottomSheet extends StatefulWidget {
  final Parking parking;
  final ParkingSlot slot;

  const ReservationBottomSheet({
    super.key,
    required this.parking,
    required this.slot,
  });

  @override
  State<ReservationBottomSheet> createState() => _ReservationBottomSheetState();
}

class _ReservationBottomSheetState extends State<ReservationBottomSheet> {
  DateTime _startTime = DateTime.now().add(const Duration(minutes: 15));
  DateTime _endTime = DateTime.now().add(const Duration(hours: 1, minutes: 15));
  final TextEditingController _plateCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadDefaultPlate());
  }

  Future<void> _loadDefaultPlate() async {
    try {
      final u = await UserService().getMe();
      if (!mounted) return;
      final p = u.defaultVehiclePlate?.trim();
      if (p != null && p.isNotEmpty) {
        _plateCtrl.text = p;
      }
    } catch (_) {}
  }

  double get _totalPrice {
    final hours = _endTime.difference(_startTime).inMinutes / 60.0;
    return (hours < 1 ? 1 : hours) * widget.parking.pricePerHour;
  }

  Duration get _duration => _endTime.difference(_startTime);

  Future<void> _pickDateTime({required bool isStart}) async {
    final now = DateTime.now();
    final initial = isStart ? _startTime : _endTime;

    final date = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: now,
      lastDate: now.add(const Duration(days: 30)),
    );
    if (date == null || !mounted) return;

    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(initial),
    );
    if (time == null || !mounted) return;

    final picked = DateTime(date.year, date.month, date.day, time.hour, time.minute);

    setState(() {
      if (isStart) {
        _startTime = picked;
        if (_endTime.isBefore(_startTime.add(const Duration(minutes: 30)))) {
          _endTime = _startTime.add(const Duration(hours: 1));
        }
      } else {
        if (picked.isAfter(_startTime)) {
          _endTime = picked;
        }
      }
    });
  }

  Future<void> _confirm() async {
    final plate = _plateCtrl.text.trim();
    if (!isValidVehiclePlate(plate)) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Enter your vehicle plate (at least 4 letters or numbers).',
          ),
          backgroundColor: AppTheme.errorColor,
        ),
      );
      return;
    }

    final provider = context.read<ReservationProvider>();
    final created = await provider.createReservation(
      parkingSlotId: widget.slot.id,
      startTime: _startTime,
      endTime: _endTime,
      vehiclePlate: plate,
    );

    if (!mounted) return;

    if (created != null) {
      Navigator.pop(context, created);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(provider.error ?? 'Failed to create reservation'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppTheme.dividerColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Title
            const Text(
              'Reserve Parking Slot',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 16),

            // Slot info
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.surfaceColor,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withAlpha(25),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.local_parking,
                        color: AppTheme.primaryColor),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.parking.name,
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 15,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Slot ${widget.slot.slotNumber} • ${widget.slot.slotType}',
                          style: const TextStyle(
                            color: AppTheme.textSecondary,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _plateCtrl,
              textCapitalization: TextCapitalization.characters,
              decoration: const InputDecoration(
                labelText: 'Vehicle plate *',
                hintText: 'e.g. 12345-A-6',
                helperText: 'Required for entry verification',
                border: OutlineInputBorder(),
                isDense: true,
              ),
            ),
            const SizedBox(height: 20),

            // Time selectors
            Row(
              children: [
                Expanded(
                  child: _timeSelector(
                    label: 'Start',
                    time: _startTime,
                    onTap: () => _pickDateTime(isStart: true),
                  ),
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 12),
                  child:
                      Icon(Icons.arrow_forward, color: AppTheme.textSecondary),
                ),
                Expanded(
                  child: _timeSelector(
                    label: 'End',
                    time: _endTime,
                    onTap: () => _pickDateTime(isStart: false),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Price summary
            Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withAlpha(15),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppTheme.primaryColor.withAlpha(50)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Duration',
                      style: TextStyle(
                          color: AppTheme.textSecondary, fontSize: 12),
                    ),
                    Text(
                      Helpers.formatDuration(_duration),
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text(
                      'Total Price',
                      style: TextStyle(
                          color: AppTheme.textSecondary, fontSize: 12),
                    ),
                    Text(
                      Helpers.formatPrice(_totalPrice),
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 20,
                        color: AppTheme.primaryColor,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Confirm button
            Consumer<ReservationProvider>(
              builder: (context, provider, _) {
                return SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: provider.isLoading ? null : _confirm,
                    child: provider.isLoading
                        ? const SizedBox(
                            height: 22,
                            width: 22,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              color: Colors.white,
                            ),
                          )
                        : const Text('Confirm Reservation'),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _plateCtrl.dispose();
    super.dispose();
  }

  Widget _timeSelector({
    required String label,
    required DateTime time,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppTheme.surfaceColor,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                color: AppTheme.textSecondary,
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              Helpers.formatDate(time),
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
