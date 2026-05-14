package org.example.smartparking.service.impl;

import org.example.smartparking.dto.response.OwnerDashboardResponse;
import org.example.smartparking.repository.ParkingGuardRepository;
import org.example.smartparking.repository.ParkingPlateScanStatsRepository;
import org.example.smartparking.repository.ParkingRepository;
import org.example.smartparking.repository.ParkingReviewRepository;
import org.example.smartparking.repository.ParkingSlotRepository;
import org.example.smartparking.repository.PaymentRepository;
import org.example.smartparking.repository.ReservationRepository;
import org.example.smartparking.repository.UserRepository;
import org.example.smartparking.repository.WithdrawalRequestRepository;
import org.example.smartparking.service.ParkingGuardResponseHelper;
import org.example.smartparking.service.ParkingNameValidator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OwnerServiceImplTest {

    @Mock private ParkingRepository parkingRepository;
    @Mock private ParkingSlotRepository parkingSlotRepository;
    @Mock private ReservationRepository reservationRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private WithdrawalRequestRepository withdrawalRequestRepository;
    @Mock private UserRepository userRepository;
    @Mock private ParkingNameValidator parkingNameValidator;
    @Mock private ParkingGuardRepository parkingGuardRepository;
    @Mock private ParkingGuardResponseHelper parkingGuardResponseHelper;
    @Mock private ParkingReviewRepository parkingReviewRepository;
    @Mock private ParkingPlateScanStatsRepository parkingPlateScanStatsRepository;

    @InjectMocks
    private OwnerServiceImpl ownerService;

    @Test
    void getDashboard_aggregatesCounts() {
        long ownerId = 5L;
        when(parkingRepository.countByOwnerId(ownerId)).thenReturn(2L);
        when(parkingSlotRepository.countByParkingOwnerId(ownerId)).thenReturn(40L);
        when(reservationRepository.countActiveByOwnerId(ownerId)).thenReturn(3L);
        when(paymentRepository.getTotalRevenueByOwnerId(ownerId)).thenReturn(100.0);
        when(paymentRepository.getRevenueSinceByOwnerId(ownerId, LocalDate.now().withDayOfMonth(1).atStartOfDay()))
                .thenReturn(50.0);
        when(paymentRepository.getRevenueSinceByOwnerId(ownerId, LocalDate.now().atStartOfDay()))
                .thenReturn(10.0);
        when(parkingPlateScanStatsRepository.sumAppUsersByOwnerAndDate(ownerId, LocalDate.now())).thenReturn(1L);
        when(parkingPlateScanStatsRepository.sumNonAppUsersByOwnerAndDate(ownerId, LocalDate.now())).thenReturn(2L);

        OwnerDashboardResponse r = ownerService.getDashboard(ownerId);
        assertThat(r.getTotalParkings()).isEqualTo(2);
        assertThat(r.getTotalSlots()).isEqualTo(40);
        assertThat(r.getActiveReservations()).isEqualTo(3);
        assertThat(r.getTotalEarnings()).isEqualTo(100.0);
        assertThat(r.getThisMonthEarnings()).isEqualTo(50.0);
        assertThat(r.getTodayEarnings()).isEqualTo(10.0);
        assertThat(r.getAppUsersToday()).isEqualTo(1);
        assertThat(r.getNonAppUsersToday()).isEqualTo(2);
    }

    @Test
    void getDashboardForAdmin_aggregatesGlobalCounts() {
        when(parkingRepository.count()).thenReturn(30L);
        when(parkingSlotRepository.count()).thenReturn(1500L);
        when(reservationRepository.countActiveReservations()).thenReturn(12L);
        when(paymentRepository.getTotalRevenue()).thenReturn(5000.0);
        when(paymentRepository.getRevenueSince(LocalDate.now().withDayOfMonth(1).atStartOfDay())).thenReturn(200.0);
        when(paymentRepository.getRevenueSince(LocalDate.now().atStartOfDay())).thenReturn(50.0);

        OwnerDashboardResponse r = ownerService.getDashboardForAdmin();
        assertThat(r.getTotalParkings()).isEqualTo(30);
        assertThat(r.getTotalSlots()).isEqualTo(1500);
        assertThat(r.getActiveReservations()).isEqualTo(12);
        assertThat(r.getTotalEarnings()).isEqualTo(5000.0);
        assertThat(r.getAppUsersToday()).isZero();
        assertThat(r.getNonAppUsersToday()).isZero();
    }
}
