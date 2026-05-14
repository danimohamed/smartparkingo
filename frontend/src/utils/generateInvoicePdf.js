/**
 * Shared invoice PDF generator for SmartParking.
 * Uses dynamic imports so jsPDF is only loaded when needed.
 *
 * @param {Object} payment  - { id, reservationId, amount, status, paymentMethod, paidAt }
 * @param {Object} [reservation] - optional { parkingName, slotNumber, startTime, endTime, userFullName }
 */
export default async function generateInvoicePdf(payment, reservation) {
    const { jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF()
    const primary = [79, 70, 229] // indigo-600
    const invNum = `INV-${String(payment.id).padStart(5, '0')}`

    // ── Header band ──────────────────────────────────────
    doc.setFillColor(...primary)
    doc.rect(0, 0, 210, 42, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('SMART PARKING', 14, 18)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Smart Parking Management System — Marrakech, Morocco', 14, 26)
    doc.text('support@smartparking.com', 14, 32)

    // Invoice label (right side)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('INVOICE', 155, 18)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(invNum, 155, 26)

    const paidDate = payment.paidAt
        ? new Date(payment.paidAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    doc.text(`Date: ${paidDate}`, 155, 32)

    // ── Invoice details section ──────────────────────────
    doc.setTextColor(60, 60, 60)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Invoice Details', 14, 56)

    const rows = [
        ['Invoice Number', invNum],
        ['Reservation Ref', `RES-${String(payment.reservationId).padStart(5, '0')}`],
        ['Status', payment.status],
        ['Payment Method', payment.paymentMethod || 'N/A'],
    ]

    if (reservation) {
        if (reservation.userFullName) rows.push(['Customer', reservation.userFullName])
        if (reservation.parkingName) rows.push(['Parking', reservation.parkingName])
        if (reservation.slotNumber) rows.push(['Slot', reservation.slotNumber])
        if (reservation.startTime) {
            rows.push(['Start Time', new Date(reservation.startTime).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })])
        }
        if (reservation.endTime) {
            rows.push(['End Time', new Date(reservation.endTime).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })])
        }
    }

    let y = 63
    doc.setFontSize(10)
    rows.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(110, 110, 110)
        doc.text(`${label}:`, 14, y)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(30, 30, 30)
        doc.text(String(value), 72, y)
        y += 7
    })

    // ── Amount table ─────────────────────────────────────
    autoTable(doc, {
        startY: y + 10,
        head: [['Description', 'Amount']],
        body: [
            ['Parking Reservation Fee', `${(payment.amount ?? 0).toFixed(2)} MAD`],
        ],
        foot: [['Total', `${(payment.amount ?? 0).toFixed(2)} MAD`]],
        headStyles: { fillColor: primary, textColor: [255, 255, 255], fontStyle: 'bold' },
        footStyles: { fillColor: [245, 245, 245], textColor: primary, fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 4 },
        margin: { left: 14, right: 14 },
        columnStyles: { 1: { halign: 'right' } },
    })

    // ── Footer ───────────────────────────────────────────
    const pageH = doc.internal.pageSize.height
    doc.setDrawColor(200)
    doc.line(14, pageH - 28, 196, pageH - 28)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text('This is an auto-generated invoice from Smart Parking.', 14, pageH - 22)
    doc.text('Thank you for using SmartParking!', 14, pageH - 16)
    doc.text(
        `Generated on ${new Date().toLocaleDateString('en-GB', { dateStyle: 'long' })} at ${new Date().toLocaleTimeString('en-GB', { timeStyle: 'short' })}`,
        14,
        pageH - 10,
    )

    doc.save(`SmartParking_${invNum}.pdf`)
}
