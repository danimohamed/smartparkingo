import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:intl/intl.dart';
import '../models/payment.dart';
import '../models/reservation.dart';

/// Generates and previews/shares a SmartParking invoice PDF.
class InvoiceGenerator {
  static final _primary = PdfColor.fromHex('#4F46E5');
  static final _dateFormat = DateFormat('dd MMM yyyy');
  static final _dateTimeFormat = DateFormat('dd MMM yyyy HH:mm');

  /// Generate and show print/share dialog for a payment invoice.
  /// [reservation] is optional — when provided, more detail is included.
  static Future<void> generate(Payment payment, {Reservation? reservation}) async {
    final pdf = pw.Document(
      title: 'SmartParking Invoice INV-${payment.id.toString().padLeft(5, '0')}',
      author: 'SmartParking',
    );

    final invNum = 'INV-${payment.id.toString().padLeft(5, '0')}';
    final resNum = 'RES-${payment.reservationId.toString().padLeft(5, '0')}';
    final paidDate = payment.paidAt != null
        ? _dateFormat.format(payment.paidAt!)
        : _dateFormat.format(DateTime.now());

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(0),
        build: (context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              // ── Header band ──
              pw.Container(
                width: double.infinity,
                padding: const pw.EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                color: _primary,
                child: pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Text('SMART PARKING',
                            style: pw.TextStyle(
                                color: PdfColors.white,
                                fontSize: 22,
                                fontWeight: pw.FontWeight.bold)),
                        pw.SizedBox(height: 4),
                        pw.Text('Smart Parking Management System — Marrakech, Morocco',
                            style: const pw.TextStyle(color: PdfColors.white, fontSize: 9)),
                        pw.SizedBox(height: 2),
                        pw.Text('support@smartparking.com',
                            style: const pw.TextStyle(color: PdfColors.white, fontSize: 9)),
                      ],
                    ),
                    pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.end,
                      children: [
                        pw.Text('INVOICE',
                            style: pw.TextStyle(
                                color: PdfColors.white,
                                fontSize: 16,
                                fontWeight: pw.FontWeight.bold)),
                        pw.SizedBox(height: 4),
                        pw.Text(invNum,
                            style: const pw.TextStyle(color: PdfColors.white, fontSize: 10)),
                        pw.SizedBox(height: 2),
                        pw.Text('Date: $paidDate',
                            style: const pw.TextStyle(color: PdfColors.white, fontSize: 10)),
                      ],
                    ),
                  ],
                ),
              ),

              pw.SizedBox(height: 24),

              // ── Invoice details ──
              pw.Padding(
                padding: const pw.EdgeInsets.symmetric(horizontal: 24),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text('Invoice Details',
                        style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold)),
                    pw.SizedBox(height: 10),
                    _detailRow('Invoice Number', invNum),
                    _detailRow('Reservation Ref', resNum),
                    _detailRow('Status', payment.status),
                    _detailRow('Payment Method', payment.paymentMethod ?? 'N/A'),
                    if (reservation != null) ...[
                      _detailRow('Customer', reservation.userFullName),
                      _detailRow('Parking', reservation.parkingName),
                      _detailRow('Slot', reservation.slotNumber),
                      _detailRow('Start Time', _dateTimeFormat.format(reservation.startTime)),
                      _detailRow('End Time', _dateTimeFormat.format(reservation.endTime)),
                    ],
                  ],
                ),
              ),

              pw.SizedBox(height: 24),

              // ── Amount table ──
              pw.Padding(
                padding: const pw.EdgeInsets.symmetric(horizontal: 24),
                child: pw.TableHelper.fromTextArray(
                  headerStyle: pw.TextStyle(
                      color: PdfColors.white,
                      fontWeight: pw.FontWeight.bold,
                      fontSize: 10),
                  headerDecoration: pw.BoxDecoration(color: _primary),
                  cellStyle: const pw.TextStyle(fontSize: 10),
                  cellPadding: const pw.EdgeInsets.all(8),
                  columnWidths: {
                    0: const pw.FlexColumnWidth(3),
                    1: const pw.FlexColumnWidth(1),
                  },
                  cellAlignments: {1: pw.Alignment.centerRight},
                  headerAlignments: {1: pw.Alignment.centerRight},
                  headers: ['Description', 'Amount'],
                  data: [
                    ['Parking Reservation Fee', '${payment.amount.toStringAsFixed(2)} MAD'],
                  ],
                ),
              ),

              pw.SizedBox(height: 8),

              // Total
              pw.Padding(
                padding: const pw.EdgeInsets.symmetric(horizontal: 24),
                child: pw.Container(
                  width: double.infinity,
                  padding: const pw.EdgeInsets.all(10),
                  color: PdfColor.fromHex('#F5F5F5'),
                  child: pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Text('Total',
                          style: pw.TextStyle(
                              fontWeight: pw.FontWeight.bold,
                              fontSize: 11,
                              color: _primary)),
                      pw.Text('${payment.amount.toStringAsFixed(2)} MAD',
                          style: pw.TextStyle(
                              fontWeight: pw.FontWeight.bold,
                              fontSize: 11,
                              color: _primary)),
                    ],
                  ),
                ),
              ),

              pw.Spacer(),

              // ── Footer ──
              pw.Padding(
                padding: const pw.EdgeInsets.symmetric(horizontal: 24),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Divider(color: PdfColors.grey300),
                    pw.SizedBox(height: 4),
                    pw.Text('This is an auto-generated invoice from Smart Parking.',
                        style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey)),
                    pw.SizedBox(height: 2),
                    pw.Text('Thank you for using SmartParking!',
                        style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey)),
                    pw.SizedBox(height: 2),
                    pw.Text(
                        'Generated on ${_dateTimeFormat.format(DateTime.now())}',
                        style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey)),
                    pw.SizedBox(height: 16),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );

    await Printing.layoutPdf(
      onLayout: (format) => pdf.save(),
      name: 'SmartParking_$invNum',
    );
  }

  static pw.Widget _detailRow(String label, String value) {
    return pw.Padding(
      padding: const pw.EdgeInsets.only(bottom: 6),
      child: pw.Row(
        children: [
          pw.SizedBox(
            width: 120,
            child: pw.Text('$label:',
                style: pw.TextStyle(
                    fontSize: 10,
                    fontWeight: pw.FontWeight.bold,
                    color: PdfColors.grey600)),
          ),
          pw.Text(value, style: const pw.TextStyle(fontSize: 10)),
        ],
      ),
    );
  }
}

