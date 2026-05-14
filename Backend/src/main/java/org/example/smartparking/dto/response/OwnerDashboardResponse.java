package org.example.smartparking.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OwnerDashboardResponse {
    private long totalParkings;
    private long totalSlots;
    private long activeReservations;
    private Double totalEarnings;
    private Double thisMonthEarnings;
    private Double todayEarnings;
    private long appUsersToday;
    private long nonAppUsersToday;
}
