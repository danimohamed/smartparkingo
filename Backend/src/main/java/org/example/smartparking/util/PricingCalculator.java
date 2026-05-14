package org.example.smartparking.util;

import org.example.smartparking.entity.Parking;

import java.time.Duration;
import java.time.LocalDateTime;

/**
 * Morocco-style pricing: first {@code graceMinutes} of the booked window are free,
 * then hourly rate with ceiling, capped by daily cap per reservation session.
 */
public final class PricingCalculator {

    public static final int DEFAULT_GRACE_MINUTES = 15;

    private PricingCalculator() {
    }

    /**
     * Computes total MAD for a reservation from start to end using parking rules.
     */
    public static double calculateReservationTotal(LocalDateTime start, LocalDateTime end, Parking parking) {
        if (end.isBefore(start) || end.isEqual(start)) {
            return 0;
        }
        int grace = DEFAULT_GRACE_MINUTES;
        long totalMinutes = Duration.between(start, end).toMinutes();
        long billableMinutes = Math.max(0, totalMinutes - grace);
        if (billableMinutes == 0) {
            return 0;
        }
        long billableHours = (billableMinutes + 59) / 60;
        if (billableHours < 1) {
            billableHours = 1;
        }
        double pricePerHour = parking.getPricePerHour();
        double subtotal = billableHours * pricePerHour;
        double cap = parking.getDailyCapPrice() != null
                ? parking.getDailyCapPrice()
                : parking.getPricingTier().defaultDailyCapMAD();
        return Math.min(subtotal, cap);
    }
}
