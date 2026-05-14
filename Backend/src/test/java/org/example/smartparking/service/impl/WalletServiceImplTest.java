package org.example.smartparking.service.impl;

import org.example.smartparking.dto.request.TopUpRequest;
import org.example.smartparking.dto.request.WalletPaymentRequest;
import org.example.smartparking.dto.response.WalletResponse;
import org.example.smartparking.dto.response.WalletTransactionResponse;
import org.example.smartparking.entity.*;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WalletServiceImplTest {

    @Mock private WalletRepository walletRepository;
    @Mock private WalletTransactionRepository walletTransactionRepository;
    @Mock private UserRepository userRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private ReservationRepository reservationRepository;

    @InjectMocks
    private WalletServiceImpl walletService;

    private User testUser;
    private Wallet testWallet;
    private Reservation testReservation;
    private Payment testPayment;
    private TopUpRequest topUpRequest;
    private WalletPaymentRequest walletPaymentRequest;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .fullName("Test User")
                .email("test@example.com")
                .password("encoded")
                .role(Role.USER)
                .build();

        testWallet = Wallet.builder()
                .id(1L)
                .user(testUser)
                .balance(100.0)
                .updatedAt(LocalDateTime.now())
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
                .status(PaymentStatus.PENDING)
                .build();

        topUpRequest = new TopUpRequest();
        topUpRequest.setAmount(50.0);
        topUpRequest.setCardNumber("4111 1111 1111 1234");
        topUpRequest.setCardHolder("Test User");
        topUpRequest.setExpiryDate("12/28");
        topUpRequest.setCvv("123");

        walletPaymentRequest = new WalletPaymentRequest();
        walletPaymentRequest.setReservationId(1L);
    }

    @Nested
    @DisplayName("getWallet()")
    class GetWalletTests {

        @Test
        @DisplayName("Should return existing wallet")
        void shouldReturnExistingWallet() {
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
            when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(testWallet));

            WalletResponse result = walletService.getWallet("test@example.com");

            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getBalance()).isEqualTo(100.0);
        }

        @Test
        @DisplayName("Should create wallet if none exists")
        void shouldCreateWalletIfNotExists() {
            Wallet newWallet = Wallet.builder()
                    .id(2L).user(testUser).balance(0.0).updatedAt(LocalDateTime.now()).build();

            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
            when(walletRepository.findByUserId(1L)).thenReturn(Optional.empty());
            when(walletRepository.save(any(Wallet.class))).thenReturn(newWallet);

            WalletResponse result = walletService.getWallet("test@example.com");

            assertThat(result.getBalance()).isEqualTo(0.0);
            verify(walletRepository).save(any(Wallet.class));
        }

        @Test
        @DisplayName("Should throw when user not found")
        void shouldThrowWhenUserNotFound() {
            when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> walletService.getWallet("unknown@example.com"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("User not found");
        }
    }

    @Nested
    @DisplayName("topUp()")
    class TopUpTests {

        @Test
        @DisplayName("Should top up wallet successfully")
        void shouldTopUp() {
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
            when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(testWallet));
            when(walletRepository.save(any(Wallet.class))).thenReturn(testWallet);
            when(walletTransactionRepository.save(any(WalletTransaction.class)))
                    .thenReturn(WalletTransaction.builder().id(1L).build());

            WalletResponse result = walletService.topUp("test@example.com", topUpRequest);

            assertThat(testWallet.getBalance()).isEqualTo(150.0); // 100 + 50
            verify(walletTransactionRepository).save(any(WalletTransaction.class));
        }

        @Test
        @DisplayName("Should record last 4 digits of card")
        void shouldRecordLast4Digits() {
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
            when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(testWallet));
            when(walletRepository.save(any(Wallet.class))).thenReturn(testWallet);
            when(walletTransactionRepository.save(any(WalletTransaction.class))).thenAnswer(inv -> {
                WalletTransaction tx = inv.getArgument(0);
                assertThat(tx.getCardLast4()).isEqualTo("1234");
                assertThat(tx.getType()).isEqualTo(TransactionType.TOP_UP);
                return tx;
            });

            walletService.topUp("test@example.com", topUpRequest);

            verify(walletTransactionRepository).save(any(WalletTransaction.class));
        }

        @Test
        @DisplayName("Should throw for invalid card number (too short)")
        void shouldThrowForInvalidCardNumber() {
            topUpRequest.setCardNumber("1234");

            assertThatThrownBy(() -> walletService.topUp("test@example.com", topUpRequest))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Invalid card number");
        }

        @Test
        @DisplayName("Should throw for invalid CVV")
        void shouldThrowForInvalidCvv() {
            topUpRequest.setCvv("12");

            assertThatThrownBy(() -> walletService.topUp("test@example.com", topUpRequest))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Invalid CVV");
        }
    }

    @Nested
    @DisplayName("payForReservation()")
    class PayForReservationTests {

        @Test
        @DisplayName("Should pay for reservation from wallet")
        void shouldPayFromWallet() {
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
            when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(testWallet));
            when(reservationRepository.findById(1L)).thenReturn(Optional.of(testReservation));
            when(paymentRepository.findByReservationId(1L)).thenReturn(Optional.of(testPayment));
            when(walletRepository.save(any(Wallet.class))).thenReturn(testWallet);
            when(paymentRepository.save(any(Payment.class))).thenReturn(testPayment);
            when(walletTransactionRepository.save(any(WalletTransaction.class)))
                    .thenReturn(WalletTransaction.builder().id(1L).build());

            WalletResponse result = walletService.payForReservation("test@example.com", walletPaymentRequest);

            assertThat(testWallet.getBalance()).isEqualTo(80.0); // 100 - 20
            assertThat(testPayment.getStatus()).isEqualTo(PaymentStatus.COMPLETED);
            assertThat(testPayment.getPaymentMethod()).isEqualTo(PaymentMethod.WALLET);
            verify(walletTransactionRepository).save(any(WalletTransaction.class));
        }

        @Test
        @DisplayName("Should throw when reservation not found")
        void shouldThrowWhenReservationNotFound() {
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
            when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(testWallet));
            walletPaymentRequest.setReservationId(999L);
            when(reservationRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> walletService.payForReservation("test@example.com", walletPaymentRequest))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Reservation not found");
        }

        @Test
        @DisplayName("Should throw when reservation belongs to another user")
        void shouldThrowWhenNotOwner() {
            User otherUser = User.builder().id(2L).email("other@example.com").build();
            testReservation.setUser(otherUser);

            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
            when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(testWallet));
            when(reservationRepository.findById(1L)).thenReturn(Optional.of(testReservation));

            assertThatThrownBy(() -> walletService.payForReservation("test@example.com", walletPaymentRequest))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("does not belong to this user");
        }

        @Test
        @DisplayName("Should throw when payment already completed")
        void shouldThrowWhenAlreadyCompleted() {
            testPayment.setStatus(PaymentStatus.COMPLETED);

            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
            when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(testWallet));
            when(reservationRepository.findById(1L)).thenReturn(Optional.of(testReservation));
            when(paymentRepository.findByReservationId(1L)).thenReturn(Optional.of(testPayment));

            assertThatThrownBy(() -> walletService.payForReservation("test@example.com", walletPaymentRequest))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("already completed");
        }

        @Test
        @DisplayName("Should throw when insufficient balance")
        void shouldThrowWhenInsufficientBalance() {
            testWallet.setBalance(5.0); // less than payment amount of 20

            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
            when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(testWallet));
            when(reservationRepository.findById(1L)).thenReturn(Optional.of(testReservation));
            when(paymentRepository.findByReservationId(1L)).thenReturn(Optional.of(testPayment));

            assertThatThrownBy(() -> walletService.payForReservation("test@example.com", walletPaymentRequest))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Insufficient wallet balance");
        }

        @Test
        @DisplayName("Should throw when payment not found for reservation")
        void shouldThrowWhenPaymentNotFound() {
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
            when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(testWallet));
            when(reservationRepository.findById(1L)).thenReturn(Optional.of(testReservation));
            when(paymentRepository.findByReservationId(1L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> walletService.payForReservation("test@example.com", walletPaymentRequest))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Payment not found");
        }
    }

    @Nested
    @DisplayName("getTransactionHistory()")
    class GetTransactionHistoryTests {

        @Test
        @DisplayName("Should return transaction history")
        void shouldReturnHistory() {
            WalletTransaction tx = WalletTransaction.builder()
                    .id(1L)
                    .wallet(testWallet)
                    .type(TransactionType.TOP_UP)
                    .amount(50.0)
                    .description("Top-up via card ending 1234")
                    .cardLast4("1234")
                    .createdAt(LocalDateTime.now())
                    .build();

            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
            when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(testWallet));
            when(walletTransactionRepository.findByWalletIdOrderByCreatedAtDesc(1L))
                    .thenReturn(List.of(tx));

            List<WalletTransactionResponse> result = walletService.getTransactionHistory("test@example.com");

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getType()).isEqualTo("TOP_UP");
            assertThat(result.get(0).getAmount()).isEqualTo(50.0);
            assertThat(result.get(0).getCardLast4()).isEqualTo("1234");
        }

        @Test
        @DisplayName("Should return empty list when no transactions")
        void shouldReturnEmpty() {
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
            when(walletRepository.findByUserId(1L)).thenReturn(Optional.of(testWallet));
            when(walletTransactionRepository.findByWalletIdOrderByCreatedAtDesc(1L))
                    .thenReturn(Collections.emptyList());

            List<WalletTransactionResponse> result = walletService.getTransactionHistory("test@example.com");

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should create wallet if needed before fetching transactions")
        void shouldCreateWalletIfNeeded() {
            Wallet newWallet = Wallet.builder()
                    .id(2L).user(testUser).balance(0.0).updatedAt(LocalDateTime.now()).build();

            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
            when(walletRepository.findByUserId(1L)).thenReturn(Optional.empty());
            when(walletRepository.save(any(Wallet.class))).thenReturn(newWallet);
            when(walletTransactionRepository.findByWalletIdOrderByCreatedAtDesc(2L))
                    .thenReturn(Collections.emptyList());

            List<WalletTransactionResponse> result = walletService.getTransactionHistory("test@example.com");

            assertThat(result).isEmpty();
            verify(walletRepository).save(any(Wallet.class));
        }
    }
}


