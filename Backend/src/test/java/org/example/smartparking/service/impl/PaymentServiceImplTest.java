package org.example.smartparking.service.impl;

import org.example.smartparking.dto.response.PaymentResponse;
import org.example.smartparking.entity.*;
import org.example.smartparking.exception.ResourceNotFoundException;
import org.example.smartparking.repository.PaymentRepository;
import org.example.smartparking.repository.UserRepository;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceImplTest {

    @Mock private PaymentRepository paymentRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    private User testUser;
    private Reservation testReservation;
    private Payment testPayment;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .fullName("Test User")
                .email("test@example.com")
                .password("encoded")
                .role(Role.USER)
                .build();

        Parking parking = Parking.builder()
                .id(1L).name("Parking Gueliz").address("Gueliz").totalSlots(50).pricePerHour(10.0).build();

        ParkingSlot slot = ParkingSlot.builder()
                .id(1L).slotNumber("A-01").status(SlotStatus.RESERVED).parking(parking).build();

        testReservation = Reservation.builder()
                .id(1L)
                .user(testUser)
                .parkingSlot(slot)
                .startTime(LocalDateTime.now().plusHours(1))
                .endTime(LocalDateTime.now().plusHours(3))
                .status(ReservationStatus.ACTIVE)
                .totalPrice(20.0)
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
    }

    @Nested
    @DisplayName("getPaymentByReservationId()")
    class GetPaymentByReservationIdTests {

        @Test
        @DisplayName("Should return payment for given reservation ID")
        void shouldReturnPayment() {
            when(paymentRepository.findByReservationId(1L)).thenReturn(Optional.of(testPayment));

            PaymentResponse result = paymentService.getPaymentByReservationId(1L);

            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getReservationId()).isEqualTo(1L);
            assertThat(result.getUserId()).isEqualTo(1L);
            assertThat(result.getAmount()).isEqualTo(20.0);
            assertThat(result.getStatus()).isEqualTo("COMPLETED");
            assertThat(result.getPaymentMethod()).isEqualTo("WALLET");
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when payment not found")
        void shouldThrowWhenNotFound() {
            when(paymentRepository.findByReservationId(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> paymentService.getPaymentByReservationId(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Payment not found for reservation id: 999");
        }
    }

    @Nested
    @DisplayName("getUserPayments()")
    class GetUserPaymentsTests {

        @Test
        @DisplayName("Should return all payments for current user")
        void shouldReturnUserPayments() {
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
            when(paymentRepository.findByUserId(1L)).thenReturn(List.of(testPayment));

            List<PaymentResponse> result = paymentService.getUserPayments("test@example.com");

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getUserId()).isEqualTo(1L);
            assertThat(result.get(0).getAmount()).isEqualTo(20.0);
        }

        @Test
        @DisplayName("Should throw when user not found")
        void shouldThrowWhenUserNotFound() {
            when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> paymentService.getUserPayments("unknown@example.com"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found");
        }

        @Test
        @DisplayName("Should return empty list when no payments")
        void shouldReturnEmpty() {
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
            when(paymentRepository.findByUserId(1L)).thenReturn(Collections.emptyList());

            List<PaymentResponse> result = paymentService.getUserPayments("test@example.com");

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("getAllPayments()")
    class GetAllPaymentsTests {

        @Test
        @DisplayName("Should return all payments")
        void shouldReturnAll() {
            when(paymentRepository.findAll()).thenReturn(List.of(testPayment));

            List<PaymentResponse> result = paymentService.getAllPayments();

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("Should return empty list when no payments exist")
        void shouldReturnEmpty() {
            when(paymentRepository.findAll()).thenReturn(Collections.emptyList());

            List<PaymentResponse> result = paymentService.getAllPayments();

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should handle null payment method gracefully")
        void shouldHandleNullPaymentMethod() {
            Payment pendingPayment = Payment.builder()
                    .id(2L)
                    .reservation(testReservation)
                    .user(testUser)
                    .amount(15.0)
                    .status(PaymentStatus.PENDING)
                    .paymentMethod(null)
                    .paidAt(LocalDateTime.now())
                    .build();

            when(paymentRepository.findAll()).thenReturn(List.of(pendingPayment));

            List<PaymentResponse> result = paymentService.getAllPayments();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getPaymentMethod()).isNull();
            assertThat(result.get(0).getStatus()).isEqualTo("PENDING");
        }
    }
}

