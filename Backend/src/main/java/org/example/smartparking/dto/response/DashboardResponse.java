package org.example.smartparking.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardResponse {
    private long totalParkings;
    private long totalSlots;
    private long availableSlots;
    private long occupiedSlots;
    private long reservedSlots;
    private long maintenanceSlots;
    private long totalUsers;
    private long adminUsers;
    private long activeReservations;
    private long completedReservations;
    private long cancelledReservations;
    private long todayReservations;
    private Double totalRevenue;
    private Double todayRevenue;
    private long pendingPayments;
    private long completedPayments;
    private long refundedPayments;
    private Double totalWalletBalance;

    // Top parkings by occupancy
    private List<TopParkingDto> topParkingsByOccupancy;
    // Revenue by parking (top 10)
    private List<TopParkingDto> topParkingsByRevenue;
    // Reservations per day (last 30 days)
    private Map<String, Long> reservationsPerDay;
    // Revenue per day (last 30 days)
    private Map<String, Double> revenuePerDay;
    // Payment method distribution
    private Map<String, Long> paymentMethodDistribution;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TopParkingDto {
        private Long id;
        private String name;
        private long totalSlots;
        private long availableSlots;
        private long occupiedSlots;
        private Double revenue;
        private long reservationCount;
    }
}

