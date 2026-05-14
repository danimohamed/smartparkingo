package org.example.smartparking.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.smartparking.entity.*;
import org.example.smartparking.repository.ParkingSlotRepository;
import org.example.smartparking.repository.ReservationRepository;
import org.example.smartparking.repository.WalletRepository;
import org.example.smartparking.repository.WalletTransactionRepository;
import org.example.smartparking.notification.PushNotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@ConditionalOnProperty(name = "app.scheduler.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
public class ReservationScheduler {

    private final ReservationRepository reservationRepository;
    private final ParkingSlotRepository parkingSlotRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    @Autowired(required = false)
    private PushNotificationService pushNotificationService;

    private static final double NO_SHOW_REFUND_RATIO = 0.5;
    private static final int ENDING_SOON_MINUTES = 10;

    /**
     * Mark no-shows: never checked in, grace period after start has passed.
     */
    @Scheduled(fixedRateString = "${app.scheduler.no-show-rate-ms:60000}")
    @Transactional
    public void processNoShows() {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(15);
        List<Reservation> candidates = reservationRepository.findNoShowCandidates(threshold);
        for (Reservation reservation : candidates) {
            reservation.setStatus(ReservationStatus.NO_SHOW);
            reservationRepository.save(reservation);

            var slot = reservation.getParkingSlot();
            if (slot.getStatus() == SlotStatus.RESERVED) {
                slot.setStatus(SlotStatus.AVAILABLE);
                parkingSlotRepository.save(slot);
            }

            if (reservation.getPayment() != null
                    && reservation.getPayment().getStatus() == PaymentStatus.COMPLETED
                    && reservation.getPayment().getPaymentMethod() == PaymentMethod.WALLET) {
                double refundAmount = reservation.getTotalPrice() * NO_SHOW_REFUND_RATIO;
                if (refundAmount > 0) {
                    walletRepository.findByUserId(reservation.getUser().getId()).ifPresent(wallet -> {
                        wallet.setBalance(wallet.getBalance() + refundAmount);
                        walletRepository.save(wallet);
                        WalletTransaction tx = WalletTransaction.builder()
                                .wallet(wallet)
                                .type(TransactionType.REFUND)
                                .amount(refundAmount)
                                .description("Partial refund (no-show) for reservation #" + reservation.getId())
                                .build();
                        walletTransactionRepository.save(tx);
                    });
                }
            }
            log.info("Marked reservation #{} as NO_SHOW and freed slot", reservation.getId());
        }
    }

    /**
     * Runs every 30 seconds to check for expired active reservations
     * and mark them as COMPLETED, freeing up their parking slot.
     */
    @Scheduled(fixedRateString = "${app.scheduler.complete-rate-ms:30000}")
    @Transactional
    public void completeExpiredReservations() {
        List<Reservation> expired = reservationRepository.findExpiredActiveReservations(LocalDateTime.now());

        for (Reservation reservation : expired) {
            var slot = reservation.getParkingSlot();
            if (!Boolean.TRUE.equals(reservation.getCheckedIn())) {
                reservation.setStatus(ReservationStatus.NO_SHOW);
                refundNoShowHalf(reservation);
            } else {
                reservation.setStatus(ReservationStatus.COMPLETED);
            }
            reservationRepository.save(reservation);

            slot.setStatus(SlotStatus.AVAILABLE);
            parkingSlotRepository.save(slot);

            log.info("Closed reservation #{} (status {}) for slot {} in parking {}",
                    reservation.getId(),
                    reservation.getStatus(),
                    slot.getSlotNumber(),
                    slot.getParking().getName());
        }

        if (!expired.isEmpty()) {
            log.info("Auto-completed {} expired reservation(s)", expired.size());
        }
    }

    /**
     * Send "ending soon" reminders shortly before reservation endTime.
     * Runs every minute, best-effort (skips if Firebase isn't configured).
     */
    @Scheduled(fixedRateString = "${app.scheduler.ending-soon-rate-ms:60000}")
    @Transactional
    public void notifyEndingSoon() {
        if (pushNotificationService == null) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime windowEnd = now.plusMinutes(ENDING_SOON_MINUTES);
        var candidates = reservationRepository.findEndingSoonCandidates(now, windowEnd);
        for (Reservation r : candidates) {
            var parkingName = r.getParkingSlot().getParking().getName();
            pushNotificationService.sendToUser(
                    r.getUser(),
                    "Your time is ending",
                    "Your reservation at " + parkingName + " ends soon.",
                    java.util.Map.of(
                            "type", "time_ending",
                            "reservationId", String.valueOf(r.getId()),
                            "parkingName", parkingName
                    )
            );
            r.setEndingSoonNotified(true);
            reservationRepository.save(r);
        }
    }

    private void refundNoShowHalf(Reservation reservation) {
        if (reservation.getPayment() == null
                || reservation.getPayment().getStatus() != PaymentStatus.COMPLETED
                || reservation.getPayment().getPaymentMethod() != PaymentMethod.WALLET) {
            return;
        }
        double refundAmount = reservation.getTotalPrice() * NO_SHOW_REFUND_RATIO;
        if (refundAmount <= 0) {
            return;
        }
        walletRepository.findByUserId(reservation.getUser().getId()).ifPresent(wallet -> {
            wallet.setBalance(wallet.getBalance() + refundAmount);
            walletRepository.save(wallet);
            WalletTransaction tx = WalletTransaction.builder()
                    .wallet(wallet)
                    .type(TransactionType.REFUND)
                    .amount(refundAmount)
                    .description("Partial refund (no-show) for reservation #" + reservation.getId())
                    .build();
            walletTransactionRepository.save(tx);
        });
    }
}
