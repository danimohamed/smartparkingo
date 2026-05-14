package org.example.smartparking.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.smartparking.dto.request.TopUpRequest;
import org.example.smartparking.dto.request.WalletPaymentRequest;
import org.example.smartparking.dto.response.WalletResponse;
import org.example.smartparking.dto.response.WalletTransactionResponse;
import org.example.smartparking.entity.*;
import org.example.smartparking.repository.*;
import org.example.smartparking.exception.BadRequestException;
import org.example.smartparking.exception.ResourceNotFoundException;
import org.example.smartparking.service.WalletService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WalletServiceImpl implements WalletService {

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final ReservationRepository reservationRepository;

    private Wallet getOrCreateWallet(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return walletRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    Wallet wallet = Wallet.builder()
                            .user(user)
                            .balance(0.0)
                            .build();
                    return walletRepository.save(wallet);
                });
    }

    @Override
    public WalletResponse getWallet(String email) {
        Wallet wallet = getOrCreateWallet(email);
        return toResponse(wallet);
    }

    @Override
    @Transactional
    public WalletResponse topUp(String email, TopUpRequest request) {
        // Simulate card validation (fake — accept any card for testing)
        String cardNum = request.getCardNumber().replaceAll("\\s", "");
        if (cardNum.length() < 13 || cardNum.length() > 19) {
            throw new BadRequestException("Invalid card number. Please enter 13-19 digits.");
        }
        if (request.getCvv().length() < 3 || request.getCvv().length() > 4) {
            throw new BadRequestException("Invalid CVV. Please enter 3-4 digits.");
        }

        Wallet wallet = getOrCreateWallet(email);
        wallet.setBalance(wallet.getBalance() + request.getAmount());
        walletRepository.save(wallet);

        // Record transaction
        String last4 = cardNum.substring(cardNum.length() - 4);
        WalletTransaction tx = WalletTransaction.builder()
                .wallet(wallet)
                .type(TransactionType.TOP_UP)
                .amount(request.getAmount())
                .description("Top-up via card ending " + last4)
                .cardLast4(last4)
                .build();
        walletTransactionRepository.save(tx);

        return toResponse(wallet);
    }

    @Override
    @Transactional
    public WalletResponse payForReservation(String email, WalletPaymentRequest request) {
        Wallet wallet = getOrCreateWallet(email);

        // Find reservation and its payment
        Reservation reservation = reservationRepository.findById(request.getReservationId())
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));

        // Verify the reservation belongs to this user
        if (!reservation.getUser().getEmail().equals(email)) {
            throw new BadRequestException("Reservation does not belong to this user");
        }

        Payment payment = paymentRepository.findByReservationId(reservation.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for this reservation"));

        if (payment.getStatus() == PaymentStatus.COMPLETED) {
            throw new BadRequestException("Payment is already completed");
        }

        Double amount = payment.getAmount();
        if (wallet.getBalance() < amount) {
            throw new BadRequestException("Insufficient wallet balance. Need " + amount + " MAD, have " + wallet.getBalance() + " MAD");
        }

        // Deduct balance
        wallet.setBalance(wallet.getBalance() - amount);
        walletRepository.save(wallet);

        // Update payment
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setPaymentMethod(PaymentMethod.WALLET);
        paymentRepository.save(payment);

        // Record transaction
        WalletTransaction tx = WalletTransaction.builder()
                .wallet(wallet)
                .type(TransactionType.PAYMENT)
                .amount(amount)
                .description("Payment for reservation #" + reservation.getId())
                .build();
        walletTransactionRepository.save(tx);

        return toResponse(wallet);
    }

    @Override
    public List<WalletTransactionResponse> getTransactionHistory(String email) {
        Wallet wallet = getOrCreateWallet(email);
        List<WalletTransaction> transactions = walletTransactionRepository
                .findByWalletIdOrderByCreatedAtDesc(wallet.getId());
        return transactions.stream().map(this::toTxResponse).collect(Collectors.toList());
    }

    private WalletResponse toResponse(Wallet wallet) {
        return WalletResponse.builder()
                .id(wallet.getId())
                .balance(wallet.getBalance())
                .updatedAt(wallet.getUpdatedAt())
                .build();
    }

    private WalletTransactionResponse toTxResponse(WalletTransaction tx) {
        return WalletTransactionResponse.builder()
                .id(tx.getId())
                .type(tx.getType().name())
                .amount(tx.getAmount())
                .description(tx.getDescription())
                .cardLast4(tx.getCardLast4())
                .createdAt(tx.getCreatedAt())
                .build();
    }
}

