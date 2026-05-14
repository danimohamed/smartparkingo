package org.example.smartparking.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.smartparking.dto.request.ReservationRequest;
import org.example.smartparking.dto.response.QrTokenResponse;
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
import org.example.smartparking.notification.PushNotificationService;
import org.example.smartparking.service.GuardChatService;
import org.example.smartparking.service.ReservationQrService;
import org.example.smartparking.service.ReservationService;
import org.example.smartparking.util.PlateNormalizer;
import org.example.smartparking.util.PricingCalculator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReservationServiceImpl implements ReservationService {

    private final ReservationRepository reservationRepository;
    private final ParkingSlotRepository parkingSlotRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final ReservationQrService reservationQrService;
    private final ParkingGuardRepository parkingGuardRepository;
    private final GuardChatService guardChatService;
    @Autowired(required = false)
    private PushNotificationService pushNotificationService;

    @Override
    @Transactional(readOnly = true)
    public QrTokenResponse getQrToken(Long reservationId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Reservation reservation = reservationRepository.findByIdWithDetails(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + reservationId));
        if (!reservation.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("You can only access your own reservations");
        }
        if (reservation.getStatus() != ReservationStatus.ACTIVE) {
            throw new BadRequestException("QR is only available for active reservations");
        }
        String token = reservationQrService.buildQrToken(reservation);
        return QrTokenResponse.builder().qrData(token).build();
    }

    @Override
    @Transactional
    public ReservationResponse createReservation(ReservationRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ParkingSlot slot = parkingSlotRepository.findByIdForUpdate(request.getParkingSlotId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parking slot not found with id: " + request.getParkingSlotId()));

        if (slot.getStatus() != SlotStatus.AVAILABLE) {
            throw new BadRequestException("Parking slot is not available");
        }

        if (request.getEndTime().isBefore(request.getStartTime())) {
            throw new BadRequestException("End time must be after start time");
        }

        // Check for conflicting reservations
        List<Reservation> conflicts = reservationRepository.findConflictingReservations(
                slot.getId(), request.getStartTime(), request.getEndTime());
        if (!conflicts.isEmpty()) {
            throw new BadRequestException("Parking slot is already reserved for the selected time period");
        }

        Parking parking = slot.getParking();
        double totalPrice = PricingCalculator.calculateReservationTotal(
                request.getStartTime(), request.getEndTime(), parking);
        String rawPlate = request.getVehiclePlate() != null ? request.getVehiclePlate().trim() : null;
        String normalizedPlate = normalizePlate(rawPlate);

        String plateNormalized = PlateNormalizer.normalize(request.getVehiclePlate());
        if (!PlateNormalizer.isValid(plateNormalized)) {
            throw new BadRequestException("Invalid vehicle plate");
        }

        // Auto-charge wallet (skip deduction when total is 0)
        Wallet wallet = walletRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BadRequestException("You don't have a wallet. Please top up your wallet first."));

        if (totalPrice > 0 && wallet.getBalance() < totalPrice) {
            throw new BadRequestException("Insufficient wallet balance. Need " + totalPrice + " MAD, have " + wallet.getBalance() + " MAD. Please top up your wallet.");
        }

        if (totalPrice > 0) {
            wallet.setBalance(wallet.getBalance() - totalPrice);
            walletRepository.save(wallet);
        }

        Reservation reservation = Reservation.builder()
                .user(user)
                .parkingSlot(slot)
                .vehiclePlateRaw(request.getVehiclePlate())
                .vehiclePlateNormalized(plateNormalized)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status(ReservationStatus.ACTIVE)
                .totalPrice(totalPrice)
                .gracePeriodMinutes(PricingCalculator.DEFAULT_GRACE_MINUTES)
                .checkedIn(false)
                .checkedOut(false)
                .vehiclePlate(rawPlate != null && !rawPlate.isBlank() ? rawPlate : null)
                .vehiclePlateNormalized(normalizedPlate)
                .build();

        reservation = reservationRepository.save(reservation);

        // Update slot status
        slot.setStatus(SlotStatus.RESERVED);
        parkingSlotRepository.save(slot);

        // Create payment record (COMPLETED when paid from wallet; zero-amount stays COMPLETED)
        Payment payment = Payment.builder()
                .reservation(reservation)
                .user(user)
                .amount(totalPrice)
                .status(PaymentStatus.COMPLETED)
                .paymentMethod(PaymentMethod.WALLET)
                .build();
        reservation.setPayment(payment);
        reservationRepository.save(reservation);

        if (totalPrice > 0) {
            WalletTransaction tx = WalletTransaction.builder()
                    .wallet(wallet)
                    .type(TransactionType.PAYMENT)
                    .amount(totalPrice)
                    .description("Payment for reservation #" + reservation.getId())
                    .build();
            walletTransactionRepository.save(tx);
        }

        List<User> guardUsers = mergeGuardsForParking(parking);
        List<Long> guardChatIds = guardChatService.ensureChatsAfterReservation(
                user, parking, reservation.getId(), guardUsers);

        Map<String, String> data = new HashMap<>();
        data.put("type", "reservation_confirmed");
        data.put("reservationId", String.valueOf(reservation.getId()));
        data.put("parkingName", parking.getName());
        if (pushNotificationService != null) {
            pushNotificationService.sendToUser(
                    user,
                    "Reservation confirmed",
                    "Your reservation at " + parking.getName() + " is confirmed.",
                    data
            );
        }

        user.setDefaultVehiclePlate(plateNormalized);
        userRepository.save(user);

        return mapToResponse(reservation, guardChatIds);
    }

    @Override
    @Transactional
    public ReservationResponse cancelReservation(Long id, String userEmail) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + id));

        if (!reservation.getUser().getEmail().equals(userEmail)) {
            throw new BadRequestException("You can only cancel your own reservations");
        }

        if (reservation.getStatus() != ReservationStatus.ACTIVE) {
            throw new BadRequestException("Only active reservations can be cancelled");
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservationRepository.save(reservation);

        // Free up the slot
        ParkingSlot slot = reservation.getParkingSlot();
        slot.setStatus(SlotStatus.AVAILABLE);
        parkingSlotRepository.save(slot);

        // Refund payment
        if (reservation.getPayment() != null) {
            Payment payment = reservation.getPayment();
            if (payment.getStatus() == PaymentStatus.COMPLETED
                    && payment.getPaymentMethod() == PaymentMethod.WALLET) {
                refundToWallet(reservation.getUser(), payment.getAmount(), reservation.getId());
            }
            payment.setStatus(PaymentStatus.REFUNDED);
        }

        return mapToResponse(reservation);
    }

    @Override
    @Transactional
    public ReservationResponse adminCancelReservation(Long id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + id));

        if (reservation.getStatus() != ReservationStatus.ACTIVE) {
            throw new BadRequestException("Only active reservations can be cancelled");
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservationRepository.save(reservation);

        ParkingSlot slot = reservation.getParkingSlot();
        slot.setStatus(SlotStatus.AVAILABLE);
        parkingSlotRepository.save(slot);

        if (reservation.getPayment() != null) {
            Payment payment = reservation.getPayment();
            if (payment.getStatus() == PaymentStatus.COMPLETED
                    && payment.getPaymentMethod() == PaymentMethod.WALLET) {
                refundToWallet(reservation.getUser(), payment.getAmount(), reservation.getId());
            }
            payment.setStatus(PaymentStatus.REFUNDED);
        }

        return mapToResponse(reservation);
    }

    @Override
    @Transactional(readOnly = true)
    public ReservationResponse getReservationById(Long id) {
        Reservation reservation = reservationRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + id));
        return mapToResponse(reservation);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReservationResponse> getUserReservations(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return reservationRepository.findByUserIdWithDetails(user.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReservationResponse> getAllReservations() {
        return reservationRepository.findAllWithDetails().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private void refundToWallet(User user, Double amount, Long reservationId) {
        walletRepository.findByUserId(user.getId()).ifPresent(wallet -> {
            wallet.setBalance(wallet.getBalance() + amount);
            walletRepository.save(wallet);

            WalletTransaction tx = WalletTransaction.builder()
                    .wallet(wallet)
                    .type(TransactionType.REFUND)
                    .amount(amount)
                    .description("Refund for cancelled reservation #" + reservationId)
                    .build();
            walletTransactionRepository.save(tx);
        });
    }

    /**
     * Guards from {@code parking_guards} (owner-assigned) plus legacy {@code users.assigned_parking_id} (seed).
     */
    private List<User> mergeGuardsForParking(Parking parking) {
        Map<Long, User> byId = new LinkedHashMap<>();
        for (ParkingGuard pg : parkingGuardRepository.findByParking_IdOrderByIdAsc(parking.getId())) {
            User g = pg.getUser();
            byId.put(g.getId(), g);
        }
        for (User g : userRepository.findByRoleAndAssignedParking_Id(Role.GUARD, parking.getId())) {
            byId.putIfAbsent(g.getId(), g);
        }
        return new ArrayList<>(byId.values());
    }

    private ReservationResponse mapToResponse(Reservation reservation) {
        return mapToResponse(reservation, null);
    }

    private ReservationResponse mapToResponse(Reservation reservation, List<Long> guardChatIds) {
        String paymentStatus = null;
        String paymentMethod = null;
        if (reservation.getPayment() != null) {
            paymentStatus = reservation.getPayment().getStatus().name();
            if (reservation.getPayment().getPaymentMethod() != null) {
                paymentMethod = reservation.getPayment().getPaymentMethod().name();
            }
        }
        Long parkingId = reservation.getParkingSlot().getParking().getId();
        return ReservationResponse.builder()
                .id(reservation.getId())
                .userId(reservation.getUser().getId())
                .userFullName(reservation.getUser().getFullName())
                .parkingSlotId(reservation.getParkingSlot().getId())
                .slotNumber(reservation.getParkingSlot().getSlotNumber())
                .parkingName(reservation.getParkingSlot().getParking().getName())
                .parkingId(parkingId)
                .guardChatIds(guardChatIds)
                .vehiclePlate(reservation.getVehiclePlateRaw())
                .startTime(reservation.getStartTime())
                .endTime(reservation.getEndTime())
                .status(reservation.getStatus().name())
                .totalPrice(reservation.getTotalPrice())
                .paymentStatus(paymentStatus)
                .paymentMethod(paymentMethod)
                .createdAt(reservation.getCreatedAt())
                .gracePeriodMinutes(reservation.getGracePeriodMinutes())
                .actualArrival(reservation.getActualArrival())
                .actualDeparture(reservation.getActualDeparture())
                .checkedIn(reservation.getCheckedIn())
                .checkedOut(reservation.getCheckedOut())
                .vehiclePlate(reservation.getVehiclePlate())
                .vehiclePlateNormalized(reservation.getVehiclePlateNormalized())
                .build();
    }

    private static String normalizePlate(String plate) {
        if (plate == null) {
            return null;
        }
        // Use the canonical normalizer so Arabic / Latin / mixed plates produce
        // the SAME key as the guard-side scan/lookup. Stripping non-A-Z chars
        // here would silently drop Arabic letters and break plate matching.
        String normalized = PlateNormalizer.normalize(plate);
        return normalized.isBlank() ? null : normalized;
    }
}

