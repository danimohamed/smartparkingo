package org.example.smartparking.service.impl;

import org.example.smartparking.dto.request.ReservationRequest;
import org.example.smartparking.dto.response.ReservationResponse;
import org.example.smartparking.entity.*;
import org.example.smartparking.exception.BadRequestException;
import org.example.smartparking.exception.ResourceNotFoundException;
import org.example.smartparking.repository.ParkingGuardRepository;
import org.example.smartparking.repository.ParkingSlotRepository;
import org.example.smartparking.repository.PaymentRepository;
import org.example.smartparking.repository.ReservationRepository;
import org.example.smartparking.repository.UserRepository;
import org.example.smartparking.repository.WalletRepository;
import org.example.smartparking.repository.WalletTransactionRepository;
import org.example.smartparking.service.GuardChatService;
import org.example.smartparking.service.ReservationQrService;
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
class ReservationServiceImplTest {

    @Mock private ReservationRepository reservationRepository;
    @Mock private ParkingSlotRepository parkingSlotRepository;
    @Mock private UserRepository userRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private WalletRepository walletRepository;
    @Mock private WalletTransactionRepository walletTransactionRepository;
    @Mock private ReservationQrService reservationQrService;
    @Mock private ParkingGuardRepository parkingGuardRepository;
    @Mock private GuardChatService guardChatService;

    @InjectMocks
    private ReservationServiceImpl reservationService;

    private User testUser;
    private Parking testParking;
    private ParkingSlot testSlot;
    private Reservation testReservation;
    private ReservationRequest reservationRequest;
    private Wallet testWallet;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .fullName("Test User")
                .email("test@example.com")
                .password("encoded")
                .role(Role.USER)
                .build();

        testParking = Parking.builder()
                .id(1L)
                .name("Parking Gueliz")
                .address("Gueliz, Marrakech")
                .totalSlots(50)
                .pricePerHour(10.0)
                .pricingTier(PricingTier.STANDARD)
                .active(true)
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

        reservationRequest = new ReservationRequest();
        reservationRequest.setParkingSlotId(1L);
        reservationRequest.setVehiclePlate("12345-A-6");
        reservationRequest.setStartTime(LocalDateTime.now().plusHours(1));
        reservationRequest.setEndTime(LocalDateTime.now().plusHours(3));

        testWallet = Wallet.builder()
                .id(1L)
                .user(testUser)
                .balance(1000.0)
                .build();
    }

    @Nested
    @DisplayName("createReservation()")
    class CreateReservationTests {

        @Test
        @DisplayName("Should create reservation successfully")
        void shouldCreateReservation() {
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
            when(parkingSlotRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(testSlot));
            when(reservationRepository.findConflictingReservations(eq(1L), any(), any()))
                    .thenReturn(Collections.emptyList());
            when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(testWallet));
            when(walletRepository.save(any(Wallet.class))).thenReturn(testWallet);
            when(reservationRepository.save(any(Reservation.class))).thenReturn(testReservation);
            when(parkingSlotRepository.save(any(ParkingSlot.class))).thenReturn(testSlot);
            when(walletTransactionRepository.save(any(WalletTransaction.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));
            when(parkingGuardRepository.findByParking_IdOrderByIdAsc(1L)).thenReturn(Collections.emptyList());
            when(userRepository.findByRoleAndAssignedParking_Id(Role.GUARD, 1L)).thenReturn(Collections.emptyList());
            when(guardChatService.ensureChatsAfterReservation(any(), any(), any(), any()))
                    .thenReturn(Collections.emptyList());

            ReservationResponse result = reservationService.createReservation(reservationRequest, "test@example.com");

            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getUserId()).isEqualTo(1L);
            assertThat(result.getSlotNumber()).isEqualTo("A-01");
            assertThat(result.getParkingName()).isEqualTo("Parking Gueliz");
            assertThat(result.getStatus()).isEqualTo("ACTIVE");
            assertThat(result.getTotalPrice()).isEqualTo(20.0);
            verify(parkingSlotRepository).save(any(ParkingSlot.class));
        }

        @Test
        @DisplayName("Should throw when user not found")
        void shouldThrowWhenUserNotFound() {
            when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> reservationService.createReservation(reservationRequest, "unknown@example.com"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found");
        }

        @Test
        @DisplayName("Should throw when parking slot not found")
        void shouldThrowWhenSlotNotFound() {
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
            reservationRequest.setParkingSlotId(999L);
            when(parkingSlotRepository.findByIdForUpdate(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> reservationService.createReservation(reservationRequest, "test@example.com"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Parking slot not found");
        }

        @Test
        @DisplayName("Should throw when slot is not available")
        void shouldThrowWhenSlotNotAvailable() {
            testSlot.setStatus(SlotStatus.OCCUPIED);
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
            when(parkingSlotRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(testSlot));

            assertThatThrownBy(() -> reservationService.createReservation(reservationRequest, "test@example.com"))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("not available");
        }

        @Test
        @DisplayName("Should throw when end time is before start time")
        void shouldThrowWhenEndTimeBeforeStartTime() {
            reservationRequest.setEndTime(reservationRequest.getStartTime().minusHours(1));
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
            when(parkingSlotRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(testSlot));

            assertThatThrownBy(() -> reservationService.createReservation(reservationRequest, "test@example.com"))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("End time must be after start time");
        }

        @Test
        @DisplayName("Should throw when conflicting reservations exist")
        void shouldThrowWhenConflicts() {
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
            when(parkingSlotRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(testSlot));
            when(reservationRepository.findConflictingReservations(eq(1L), any(), any()))
                    .thenReturn(List.of(testReservation));

            assertThatThrownBy(() -> reservationService.createReservation(reservationRequest, "test@example.com"))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("already reserved");
        }

        @Test
        @DisplayName("Should calculate minimum 1 hour price for short reservations")
        void shouldCalculateMinimumOneHourPrice() {
            reservationRequest.setStartTime(LocalDateTime.now().plusHours(1));
            reservationRequest.setEndTime(LocalDateTime.now().plusHours(1).plusMinutes(30));

            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
            when(parkingSlotRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(testSlot));
            when(reservationRepository.findConflictingReservations(eq(1L), any(), any()))
                    .thenReturn(Collections.emptyList());
            when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(testWallet));
            when(walletRepository.save(any(Wallet.class))).thenReturn(testWallet);
            when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> {
                Reservation r = invocation.getArgument(0);
                r.setId(1L);
                return r;
            });
            when(parkingSlotRepository.save(any(ParkingSlot.class))).thenReturn(testSlot);
            when(walletTransactionRepository.save(any(WalletTransaction.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));
            when(parkingGuardRepository.findByParking_IdOrderByIdAsc(1L)).thenReturn(Collections.emptyList());
            when(userRepository.findByRoleAndAssignedParking_Id(Role.GUARD, 1L)).thenReturn(Collections.emptyList());
            when(guardChatService.ensureChatsAfterReservation(any(), any(), any(), any()))
                    .thenReturn(Collections.emptyList());

            ReservationResponse result = reservationService.createReservation(reservationRequest, "test@example.com");

            // minimum 1 hour × 10 MAD = 10.0 MAD
            assertThat(result.getTotalPrice()).isGreaterThanOrEqualTo(10.0);
        }
    }

    @Nested
    @DisplayName("cancelReservation()")
    class CancelReservationTests {

        @Test
        @DisplayName("Should cancel own active reservation")
        void shouldCancelReservation() {
            Payment payment = Payment.builder()
                    .id(1L).status(PaymentStatus.PENDING).amount(20.0).build();
            testReservation.setPayment(payment);

            when(reservationRepository.findById(1L)).thenReturn(Optional.of(testReservation));
            when(reservationRepository.save(any(Reservation.class))).thenReturn(testReservation);
            when(parkingSlotRepository.save(any(ParkingSlot.class))).thenReturn(testSlot);

            ReservationResponse result = reservationService.cancelReservation(1L, "test@example.com");

            assertThat(result.getStatus()).isEqualTo("CANCELLED");
            assertThat(testSlot.getStatus()).isEqualTo(SlotStatus.AVAILABLE);
            assertThat(payment.getStatus()).isEqualTo(PaymentStatus.REFUNDED);
        }

        @Test
        @DisplayName("Should throw when reservation not found")
        void shouldThrowWhenNotFound() {
            when(reservationRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> reservationService.cancelReservation(999L, "test@example.com"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Reservation not found");
        }

        @Test
        @DisplayName("Should throw when cancelling another user's reservation")
        void shouldThrowWhenNotOwner() {
            when(reservationRepository.findById(1L)).thenReturn(Optional.of(testReservation));

            assertThatThrownBy(() -> reservationService.cancelReservation(1L, "other@example.com"))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("only cancel your own");
        }

        @Test
        @DisplayName("Should throw when reservation is not active")
        void shouldThrowWhenNotActive() {
            testReservation.setStatus(ReservationStatus.COMPLETED);
            when(reservationRepository.findById(1L)).thenReturn(Optional.of(testReservation));

            assertThatThrownBy(() -> reservationService.cancelReservation(1L, "test@example.com"))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Only active reservations");
        }

        @Test
        @DisplayName("Should handle cancellation when no payment exists")
        void shouldHandleNoPayment() {
            testReservation.setPayment(null);
            when(reservationRepository.findById(1L)).thenReturn(Optional.of(testReservation));
            when(reservationRepository.save(any(Reservation.class))).thenReturn(testReservation);
            when(parkingSlotRepository.save(any(ParkingSlot.class))).thenReturn(testSlot);

            ReservationResponse result = reservationService.cancelReservation(1L, "test@example.com");

            assertThat(result.getStatus()).isEqualTo("CANCELLED");
        }
    }

    @Nested
    @DisplayName("adminCancelReservation()")
    class AdminCancelReservationTests {

        @Test
        @DisplayName("Should cancel any reservation without ownership check")
        void shouldAdminCancel() {
            Payment payment = Payment.builder()
                    .id(1L).status(PaymentStatus.PENDING).amount(20.0).build();
            testReservation.setPayment(payment);

            when(reservationRepository.findById(1L)).thenReturn(Optional.of(testReservation));
            when(reservationRepository.save(any(Reservation.class))).thenReturn(testReservation);
            when(parkingSlotRepository.save(any(ParkingSlot.class))).thenReturn(testSlot);

            ReservationResponse result = reservationService.adminCancelReservation(1L);

            assertThat(result.getStatus()).isEqualTo("CANCELLED");
            assertThat(testSlot.getStatus()).isEqualTo(SlotStatus.AVAILABLE);
            assertThat(payment.getStatus()).isEqualTo(PaymentStatus.REFUNDED);
        }

        @Test
        @DisplayName("Should throw when reservation not found")
        void shouldThrowWhenNotFound() {
            when(reservationRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> reservationService.adminCancelReservation(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Should throw when reservation is not active")
        void shouldThrowWhenNotActive() {
            testReservation.setStatus(ReservationStatus.CANCELLED);
            when(reservationRepository.findById(1L)).thenReturn(Optional.of(testReservation));

            assertThatThrownBy(() -> reservationService.adminCancelReservation(1L))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Only active reservations");
        }
    }

    @Nested
    @DisplayName("getReservationById()")
    class GetReservationByIdTests {

        @Test
        @DisplayName("Should return reservation by ID")
        void shouldReturnById() {
            when(reservationRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(testReservation));

            ReservationResponse result = reservationService.getReservationById(1L);

            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getSlotNumber()).isEqualTo("A-01");
        }

        @Test
        @DisplayName("Should throw when not found")
        void shouldThrowWhenNotFound() {
            when(reservationRepository.findByIdWithDetails(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> reservationService.getReservationById(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("getUserReservations()")
    class GetUserReservationsTests {

        @Test
        @DisplayName("Should return current user's reservations")
        void shouldReturnUserReservations() {
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
            when(reservationRepository.findByUserIdWithDetails(1L)).thenReturn(List.of(testReservation));

            List<ReservationResponse> result = reservationService.getUserReservations("test@example.com");

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getUserId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("Should throw when user not found")
        void shouldThrowWhenUserNotFound() {
            when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> reservationService.getUserReservations("unknown@example.com"))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Should return empty list when no reservations")
        void shouldReturnEmpty() {
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
            when(reservationRepository.findByUserIdWithDetails(1L)).thenReturn(Collections.emptyList());

            List<ReservationResponse> result = reservationService.getUserReservations("test@example.com");

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("getAllReservations()")
    class GetAllReservationsTests {

        @Test
        @DisplayName("Should return all reservations")
        void shouldReturnAll() {
            when(reservationRepository.findAllWithDetails()).thenReturn(List.of(testReservation));

            List<ReservationResponse> result = reservationService.getAllReservations();

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("Should return empty list when no reservations")
        void shouldReturnEmpty() {
            when(reservationRepository.findAllWithDetails()).thenReturn(Collections.emptyList());

            List<ReservationResponse> result = reservationService.getAllReservations();

            assertThat(result).isEmpty();
        }
    }
}

