import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/reservation.dart';
import '../../models/payment.dart';
import '../../providers/reservation_provider.dart';
import '../../utils/theme.dart';
import '../../utils/helpers.dart';
import '../../utils/invoice_generator.dart';
import 'reservation_qr_screen.dart';

class MyReservationsScreen extends StatefulWidget {
  final bool embedded;
  const MyReservationsScreen({super.key, this.embedded = false});

  @override
  State<MyReservationsScreen> createState() => _MyReservationsScreenState();
}

class _MyReservationsScreenState extends State<MyReservationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ReservationProvider>().loadReservations();
    });
  }

  Future<void> _cancel(Reservation r) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Cancel Reservation'),
        content: Text(
            'Cancel reservation for ${r.parkingName} — Slot ${r.slotNumber}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('No'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.errorColor,
            ),
            child: const Text('Cancel It'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      await context.read<ReservationProvider>().cancelReservation(r.id);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: widget.embedded
            ? null
            : IconButton(
                icon: const Icon(Icons.arrow_back_ios_new, size: 20),
                onPressed: () => Navigator.pop(context),
              ),
        automaticallyImplyLeading: !widget.embedded,
        title: const Text('My Reservations'),
      ),
      body: Consumer<ReservationProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.reservations.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }
          if (provider.reservations.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: AppTheme.primaryColor.withAlpha(20),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.bookmark_outline,
                          size: 40, color: AppTheme.primaryColor),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'No reservations yet',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Find a parking spot on the map\nand make your first reservation!',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppTheme.textSecondary,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: provider.loadReservations,
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: provider.reservations.length,
              itemBuilder: (context, index) {
                final r = provider.reservations[index];
                return _reservationCard(r);
              },
            ),
          );
        },
      ),
    );
  }

  Widget _reservationCard(Reservation r) {
    final statusColor = AppTheme.reservationStatusColor(r.status);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: statusColor.withAlpha(25),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(Icons.local_parking, color: statusColor),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        r.parkingName,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 15,
                        ),
                      ),
                      Text(
                        'Slot ${r.slotNumber}',
                        style: const TextStyle(
                          color: AppTheme.textSecondary,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withAlpha(25),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    Helpers.reservationStatusLabel(r.status),
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: statusColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            const Divider(height: 1),
            const SizedBox(height: 14),

            // Time row
            Row(
              children: [
                _timeCol('Start', Helpers.formatDate(r.startTime)),
                const SizedBox(width: 16),
                const Icon(Icons.arrow_forward,
                    size: 16, color: AppTheme.textSecondary),
                const SizedBox(width: 16),
                _timeCol('End', Helpers.formatDate(r.endTime)),
              ],
            ),
            const SizedBox(height: 14),

            // Price & actions
            Row(
              children: [
                Text(
                  Helpers.formatPrice(r.totalPrice),
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 18,
                    color: AppTheme.primaryColor,
                  ),
                ),
                const Spacer(),
                if (r.isCompleted)
                  TextButton.icon(
                    onPressed: () => InvoiceGenerator.generate(
                      Payment(
                        id: r.id,
                        reservationId: r.id,
                        userId: r.userId,
                        amount: r.totalPrice,
                        status: 'COMPLETED',
                      ),
                      reservation: r,
                    ),
                    icon: const Icon(Icons.download,
                        size: 18, color: AppTheme.primaryColor),
                    label: const Text(
                      'Invoice',
                      style: TextStyle(color: AppTheme.primaryColor),
                    ),
                  ),
                if (r.isActive) ...[
                  TextButton.icon(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) =>
                              ReservationQrScreen(reservationId: r.id),
                        ),
                      );
                    },
                    icon: const Icon(Icons.qr_code_2,
                        size: 18, color: AppTheme.primaryColor),
                    label: const Text(
                      'QR',
                      style: TextStyle(color: AppTheme.primaryColor),
                    ),
                  ),
                  TextButton.icon(
                    onPressed: () => _cancel(r),
                    icon: const Icon(Icons.cancel_outlined,
                        size: 18, color: AppTheme.errorColor),
                    label: const Text(
                      'Cancel',
                      style: TextStyle(color: AppTheme.errorColor),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _timeCol(String label, String value) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
                fontSize: 11, color: AppTheme.textSecondary),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: const TextStyle(
              fontWeight: FontWeight.w500,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}
