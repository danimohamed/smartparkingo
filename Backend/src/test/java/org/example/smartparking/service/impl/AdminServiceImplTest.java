package org.example.smartparking.service.impl;

import org.example.smartparking.dto.request.ChangeRoleRequest;
import org.example.smartparking.dto.response.AdminWalletResponse;
import org.example.smartparking.dto.response.DashboardResponse;
import org.example.smartparking.dto.response.UserResponse;
import org.example.smartparking.dto.response.WalletTransactionResponse;
import org.example.smartparking.entity.*;
import org.example.smartparking.exception.BadRequestException;
import org.example.smartparking.exception.ResourceNotFoundException;
import org.example.smartparking.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceImplTest {

    @Mock private ParkingRepository parkingRepository;
    @Mock private ParkingSlotRepository parkingSlotRepository;
    @Mock private UserRepository userRepository;
    @Mock private ReservationRepository reservationRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private WalletRepository walletRepository;
    @Mock private WalletTransactionRepository walletTransactionRepository;

    @InjectMocks
    private AdminServiceImpl adminService;

    private User testUser;
    private User adminUser;
    private Parking testParking;
    private ParkingSlot testSlot;
    private Reservation testReservation;
    private Payment testPayment;
    private Wallet testWallet;
    private WalletTransaction testTransaction;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .fullName("Test User")
                .email("test@example.com")
                .password("encoded_password")
                .phone("+212600000000")
                .role(Role.USER)
                .createdAt(LocalDateTime.now())
                .build();

        adminUser = User.builder()
                .id(2L)
                .fullName("Admin User")
                .email("admin@smartparking.com")
                .password("encoded_password")
                .role(Role.ADMIN)
                .createdAt(LocalDateTime.now())
                .build();

        testParking = Parking.builder()
                .id(1L)
                .name("Parking Gueliz")
                .address("Gueliz, Marrakech")
                .totalSlots(50)
                .pricePerHour(10.0)
                .active(true)
                .latitude(31.6295)
                .longitude(-7.9811)
                .build();

        testSlot = ParkingSlot.builder()
                .id(1L)
                .slotNumber("A-01")
                .status(SlotStatus.AVAILABLE)
                .slotType(SlotType.STANDARD)
                .floor("RDC")
                .parking(testParking)
                .build();

        testReservation = Reservation.builder()
                .id(1L)
                .user(testUser)
                .parkingSlot(testSlot)
                .startTime(LocalDateTime.now().plusHours(1))
                .endTime(LocalDateTime.now().plusHours(3))
                .status(ReservationStatus.ACTIVE)
                .totalPrice(20.0)
                .createdAt(LocalDateTime.now())
                .build();

        testPayment = Payment.builder()
                .id(1L)
                .reservation(testReservation)
                .user(testUser)
                .amount(20.0)
                .status(PaymentStatus.COMPLETED)
                .paymentMethod(PaymentMethod.WALLET)
                .paidAt(LocalDateTime.now())
                .build();

        testWallet = Wallet.builder()
                .id(1L)
                .user(testUser)
                .balance(100.0)
                .updatedAt(LocalDateTime.now())
                .build();

        testTransaction = WalletTransaction.builder()
                .id(1L)
                .wallet(testWallet)
                .type(TransactionType.TOP_UP)
                .amount(100.0)
                .description("Top-up via card ending 1234")
                .cardLast4("1234")
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("getDashboard()")
    class GetDashboardTests {

        @Test
        @DisplayName("Should return complete dashboard stats")
        void shouldReturnDashboardStats() {
            // Arrange
            when(parkingRepository.count()).thenReturn(30L);
            when(parkingSlotRepository.count()).thenReturn(1500L);
            when(parkingSlotRepository.countByStatus(SlotStatus.AVAILABLE)).thenReturn(975L);
            when(parkingSlotRepository.countByStatus(SlotStatus.OCCUPIED)).thenReturn(270L);
            when(parkingSlotRepository.countByStatus(SlotStatus.RESERVED)).thenReturn(180L);
            when(parkingSlotRepository.countByStatus(SlotStatus.MAINTENANCE)).thenReturn(75L);
            when(userRepository.count()).thenReturn(10L);
            when(userRepository.countByRole(Role.ADMIN)).thenReturn(2L);
            when(reservationRepository.countActiveReservations()).thenReturn(5L);
            when(reservationRepository.countByStatus(ReservationStatus.COMPLETED)).thenReturn(50L);
            when(reservationRepository.countByStatus(ReservationStatus.CANCELLED)).thenReturn(3L);
            when(reservationRepository.countReservationsSince(any(LocalDateTime.class))).thenReturn(2L);
            when(paymentRepository.getTotalRevenue()).thenReturn(5000.0);
            when(paymentRepository.getRevenueSince(any(LocalDateTime.class))).thenReturn(200.0);
            when(paymentRepository.countByStatus(PaymentStatus.PENDING)).thenReturn(5L);
            when(paymentRepository.countByStatus(PaymentStatus.COMPLETED)).thenReturn(50L);
            when(paymentRepository.countByStatus(PaymentStatus.REFUNDED)).thenReturn(3L);
            when(walletRepository.getTotalBalance()).thenReturn(1500.0);
            when(parkingRepository.findAll()).thenReturn(List.of(testParking));
            when(parkingSlotRepository.findByParkingId(testParking.getId())).thenReturn(List.of(testSlot));
            when(parkingSlotRepository.countByParkingIdAndStatus(eq(testParking.getId()), any())).thenReturn(10L);
            when(paymentRepository.findByStatus(PaymentStatus.COMPLETED)).thenReturn(List.of(testPayment));
            when(reservationRepository.findAll()).thenReturn(List.of(testReservation));

            // Act
            DashboardResponse result = adminService.getDashboard();

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getTotalParkings()).isEqualTo(30L);
            assertThat(result.getTotalSlots()).isEqualTo(1500L);
            assertThat(result.getAvailableSlots()).isEqualTo(975L);
            assertThat(result.getOccupiedSlots()).isEqualTo(270L);
            assertThat(result.getReservedSlots()).isEqualTo(180L);
            assertThat(result.getMaintenanceSlots()).isEqualTo(75L);
            assertThat(result.getTotalUsers()).isEqualTo(10L);
            assertThat(result.getAdminUsers()).isEqualTo(2L);
            assertThat(result.getActiveReservations()).isEqualTo(5L);
            assertThat(result.getCompletedReservations()).isEqualTo(50L);
            assertThat(result.getCancelledReservations()).isEqualTo(3L);
            assertThat(result.getTodayReservations()).isEqualTo(2L);
            assertThat(result.getTotalRevenue()).isEqualTo(5000.0);
            assertThat(result.getTodayRevenue()).isEqualTo(200.0);
            assertThat(result.getPendingPayments()).isEqualTo(5L);
            assertThat(result.getCompletedPayments()).isEqualTo(50L);
            assertThat(result.getRefundedPayments()).isEqualTo(3L);
            assertThat(result.getTotalWalletBalance()).isEqualTo(1500.0);
        }

        @Test
        @DisplayName("Should handle null revenue values gracefully")
        void shouldHandleNullRevenue() {
            when(parkingRepository.count()).thenReturn(0L);
            when(parkingSlotRepository.count()).thenReturn(0L);
            when(parkingSlotRepository.countByStatus(any())).thenReturn(0L);
            when(userRepository.count()).thenReturn(0L);
            when(userRepository.countByRole(any())).thenReturn(0L);
            when(reservationRepository.countActiveReservations()).thenReturn(0L);
            when(reservationRepository.countByStatus(any())).thenReturn(0L);
            when(reservationRepository.countReservationsSince(any())).thenReturn(0L);
            when(paymentRepository.getTotalRevenue()).thenReturn(null);
            when(paymentRepository.getRevenueSince(any())).thenReturn(null);
            when(paymentRepository.countByStatus(any())).thenReturn(0L);
            when(walletRepository.getTotalBalance()).thenReturn(null);
            when(parkingRepository.findAll()).thenReturn(Collections.emptyList());
            when(paymentRepository.findByStatus(PaymentStatus.COMPLETED)).thenReturn(Collections.emptyList());
            when(reservationRepository.findAll()).thenReturn(Collections.emptyList());

            DashboardResponse result = adminService.getDashboard();

            assertThat(result.getTotalRevenue()).isEqualTo(0.0);
            assertThat(result.getTodayRevenue()).isEqualTo(0.0);
            assertThat(result.getTotalWalletBalance()).isEqualTo(0.0);
        }

        @Test
        @DisplayName("Should return top parkings by occupancy (max 5)")
        void shouldReturnTopParkingsByOccupancy() {
            when(parkingRepository.count()).thenReturn(1L);
            when(parkingSlotRepository.count()).thenReturn(50L);
            when(parkingSlotRepository.countByStatus(any(SlotStatus.class))).thenReturn(10L);
            when(userRepository.count()).thenReturn(1L);
            when(userRepository.countByRole(any())).thenReturn(0L);
            when(reservationRepository.countActiveReservations()).thenReturn(0L);
            when(reservationRepository.countByStatus(any())).thenReturn(0L);
            when(reservationRepository.countReservationsSince(any())).thenReturn(0L);
            when(paymentRepository.getTotalRevenue()).thenReturn(0.0);
            when(paymentRepository.getRevenueSince(any())).thenReturn(0.0);
            when(paymentRepository.countByStatus(any())).thenReturn(0L);
            when(walletRepository.getTotalBalance()).thenReturn(0.0);
            when(parkingRepository.findAll()).thenReturn(List.of(testParking));
            when(parkingSlotRepository.findByParkingId(testParking.getId())).thenReturn(List.of(testSlot));
            when(parkingSlotRepository.countByParkingIdAndStatus(eq(testParking.getId()), any())).thenReturn(5L);
            when(paymentRepository.findByStatus(PaymentStatus.COMPLETED)).thenReturn(Collections.emptyList());
            when(reservationRepository.findAll()).thenReturn(Collections.emptyList());

            DashboardResponse result = adminService.getDashboard();

            assertThat(result.getTopParkingsByOccupancy()).isNotEmpty();
            assertThat(result.getTopParkingsByOccupancy()).hasSizeLessThanOrEqualTo(5);
            assertThat(result.getTopParkingsByOccupancy().get(0).getName()).isEqualTo("Parking Gueliz");
        }

        @Test
        @DisplayName("Should compute payment method distribution")
        void shouldComputePaymentMethodDistribution() {
            when(parkingRepository.count()).thenReturn(1L);
            when(parkingSlotRepository.count()).thenReturn(50L);
            when(parkingSlotRepository.countByStatus(any(SlotStatus.class))).thenReturn(10L);
            when(userRepository.count()).thenReturn(1L);
            when(userRepository.countByRole(any())).thenReturn(0L);
            when(reservationRepository.countActiveReservations()).thenReturn(0L);
            when(reservationRepository.countByStatus(any())).thenReturn(0L);
            when(reservationRepository.countReservationsSince(any())).thenReturn(0L);
            when(paymentRepository.getTotalRevenue()).thenReturn(20.0);
            when(paymentRepository.getRevenueSince(any())).thenReturn(20.0);
            when(paymentRepository.countByStatus(any())).thenReturn(1L);
            when(walletRepository.getTotalBalance()).thenReturn(80.0);
            when(parkingRepository.findAll()).thenReturn(List.of(testParking));
            when(parkingSlotRepository.findByParkingId(testParking.getId())).thenReturn(List.of(testSlot));
            when(parkingSlotRepository.countByParkingIdAndStatus(eq(testParking.getId()), any())).thenReturn(5L);
            when(paymentRepository.findByStatus(PaymentStatus.COMPLETED)).thenReturn(List.of(testPayment));
            when(reservationRepository.findAll()).thenReturn(List.of(testReservation));

            DashboardResponse result = adminService.getDashboard();

            assertThat(result.getPaymentMethodDistribution()).containsKey("WALLET");
            assertThat(result.getPaymentMethodDistribution().get("WALLET")).isEqualTo(1L);
        }

        @Test
        @DisplayName("Should return reservations and revenue per day (30 days)")
        void shouldReturnPerDayData() {
            when(parkingRepository.count()).thenReturn(0L);
            when(parkingSlotRepository.count()).thenReturn(0L);
            when(parkingSlotRepository.countByStatus(any())).thenReturn(0L);
            when(userRepository.count()).thenReturn(0L);
            when(userRepository.countByRole(any())).thenReturn(0L);
            when(reservationRepository.countActiveReservations()).thenReturn(0L);
            when(reservationRepository.countByStatus(any())).thenReturn(0L);
            when(reservationRepository.countReservationsSince(any())).thenReturn(0L);
            when(paymentRepository.getTotalRevenue()).thenReturn(0.0);
            when(paymentRepository.getRevenueSince(any())).thenReturn(0.0);
            when(paymentRepository.countByStatus(any())).thenReturn(0L);
            when(walletRepository.getTotalBalance()).thenReturn(0.0);
            when(parkingRepository.findAll()).thenReturn(Collections.emptyList());
            when(paymentRepository.findByStatus(PaymentStatus.COMPLETED)).thenReturn(Collections.emptyList());
            when(reservationRepository.findAll()).thenReturn(Collections.emptyList());

            DashboardResponse result = adminService.getDashboard();

            assertThat(result.getReservationsPerDay()).hasSize(30);
            assertThat(result.getRevenuePerDay()).hasSize(30);
        }
    }

    @Nested
    @DisplayName("getAllUsers()")
    class GetAllUsersTests {

        @Test
        @DisplayName("Should return all users as UserResponse list")
        void shouldReturnAllUsers() {
            when(userRepository.findAll()).thenReturn(List.of(testUser, adminUser));

            List<UserResponse> result = adminService.getAllUsers();

            assertThat(result).hasSize(2);
            assertThat(result.get(0).getEmail()).isEqualTo("test@example.com");
            assertThat(result.get(0).getRole()).isEqualTo("USER");
            assertThat(result.get(1).getEmail()).isEqualTo("admin@smartparking.com");
            assertThat(result.get(1).getRole()).isEqualTo("ADMIN");
        }

        @Test
        @DisplayName("Should return empty list when no users exist")
        void shouldReturnEmptyList() {
            when(userRepository.findAll()).thenReturn(Collections.emptyList());

            List<UserResponse> result = adminService.getAllUsers();

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("deleteUser()")
    class DeleteUserTests {

        @Test
        @DisplayName("Should delete existing user")
        void shouldDeleteUser() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

            adminService.deleteUser(1L);

            verify(userRepository).delete(testUser);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException for non-existing user")
        void shouldThrowWhenUserNotFound() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> adminService.deleteUser(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found with id: 999");
        }
    }

    @Nested
    @DisplayName("changeUserRole()")
    class ChangeUserRoleTests {

        @Test
        @DisplayName("Should change user role to ADMIN")
        void shouldChangeRoleToAdmin() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenReturn(testUser);

            ChangeRoleRequest req = new ChangeRoleRequest();
            req.setRole("ADMIN");
            UserResponse result = adminService.changeUserRole(1L, req);

            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(1L);
            verify(userRepository).save(testUser);
            assertThat(testUser.getRole()).isEqualTo(Role.ADMIN);
        }

        @Test
        @DisplayName("Should change user role to USER (case-insensitive)")
        void shouldHandleCaseInsensitiveRole() {
            when(userRepository.findById(2L)).thenReturn(Optional.of(adminUser));
            when(userRepository.save(any(User.class))).thenReturn(adminUser);

            ChangeRoleRequest req = new ChangeRoleRequest();
            req.setRole("user");
            UserResponse result = adminService.changeUserRole(2L, req);

            assertThat(adminUser.getRole()).isEqualTo(Role.USER);
        }

        @Test
        @DisplayName("Should throw BadRequestException for invalid role")
        void shouldThrowForInvalidRole() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

            ChangeRoleRequest bad = new ChangeRoleRequest();
            bad.setRole("SUPERADMIN");
            assertThatThrownBy(() -> adminService.changeUserRole(1L, bad))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Invalid role: SUPERADMIN");
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException for non-existing user")
        void shouldThrowWhenUserNotFound() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            ChangeRoleRequest req = new ChangeRoleRequest();
            req.setRole("ADMIN");
            assertThatThrownBy(() -> adminService.changeUserRole(999L, req))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found with id: 999");
        }
    }

    @Nested
    @DisplayName("getAllWallets()")
    class GetAllWalletsTests {

        @Test
        @DisplayName("Should return all wallets with user info")
        void shouldReturnAllWallets() {
            when(walletRepository.findAll()).thenReturn(List.of(testWallet));

            List<AdminWalletResponse> result = adminService.getAllWallets();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getUserId()).isEqualTo(1L);
            assertThat(result.get(0).getFullName()).isEqualTo("Test User");
            assertThat(result.get(0).getEmail()).isEqualTo("test@example.com");
            assertThat(result.get(0).getBalance()).isEqualTo(100.0);
        }

        @Test
        @DisplayName("Should return empty list when no wallets exist")
        void shouldReturnEmptyList() {
            when(walletRepository.findAll()).thenReturn(Collections.emptyList());

            List<AdminWalletResponse> result = adminService.getAllWallets();

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("getWalletTransactionsByUser()")
    class GetWalletTransactionsByUserTests {

        @Test
        @DisplayName("Should return transaction history for user")
        void shouldReturnTransactions() {
            when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(testWallet));
            when(walletTransactionRepository.findByWalletIdOrderByCreatedAtDesc(testWallet.getId()))
                    .thenReturn(List.of(testTransaction));

            List<WalletTransactionResponse> result = adminService.getWalletTransactionsByUser(1L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getType()).isEqualTo("TOP_UP");
            assertThat(result.get(0).getAmount()).isEqualTo(100.0);
            assertThat(result.get(0).getCardLast4()).isEqualTo("1234");
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when wallet not found for user")
        void shouldThrowWhenWalletNotFound() {
            when(walletRepository.findByUserId(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> adminService.getWalletTransactionsByUser(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Wallet not found for user: 999");
        }

        @Test
        @DisplayName("Should return empty list when no transactions exist")
        void shouldReturnEmptyTransactions() {
            when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(testWallet));
            when(walletTransactionRepository.findByWalletIdOrderByCreatedAtDesc(testWallet.getId()))
                    .thenReturn(Collections.emptyList());

            List<WalletTransactionResponse> result = adminService.getWalletTransactionsByUser(1L);

            assertThat(result).isEmpty();
        }
    }
}

