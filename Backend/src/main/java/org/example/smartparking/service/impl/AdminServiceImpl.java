package org.example.smartparking.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.smartparking.dto.request.ChangeRoleRequest;
import org.example.smartparking.dto.response.AdminWalletResponse;
import org.example.smartparking.dto.response.DashboardResponse;
import org.example.smartparking.dto.response.UserResponse;
import org.example.smartparking.dto.response.WalletTransactionResponse;
import org.example.smartparking.dto.response.WithdrawalResponse;
import org.example.smartparking.entity.*;
import org.example.smartparking.exception.BadRequestException;
import org.example.smartparking.exception.ResourceNotFoundException;
import org.example.smartparking.repository.*;
import org.example.smartparking.service.AdminService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final ParkingRepository parkingRepository;
    private final ParkingSlotRepository parkingSlotRepository;
    private final UserRepository userRepository;
    private final ReservationRepository reservationRepository;
    private final PaymentRepository paymentRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final WithdrawalRequestRepository withdrawalRequestRepository;

    @Override
    @Transactional(readOnly = true)
    public DashboardResponse getDashboard() {
        // Basic counts
        long totalParkings = parkingRepository.count();
        long totalSlots = parkingSlotRepository.count();
        long availableSlots = parkingSlotRepository.countByStatus(SlotStatus.AVAILABLE);
        long occupiedSlots = parkingSlotRepository.countByStatus(SlotStatus.OCCUPIED);
        long reservedSlots = parkingSlotRepository.countByStatus(SlotStatus.RESERVED);
        long maintenanceSlots = parkingSlotRepository.countByStatus(SlotStatus.MAINTENANCE);
        long totalUsers = userRepository.count();
        long adminUsers = userRepository.countByRole(Role.ADMIN);

        // Reservation stats
        long activeReservations = reservationRepository.countActiveReservations();
        long completedReservations = reservationRepository.countByStatus(ReservationStatus.COMPLETED);
        long cancelledReservations = reservationRepository.countByStatus(ReservationStatus.CANCELLED);
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        long todayReservations = reservationRepository.countReservationsSince(todayStart);

        // Payment stats
        Double totalRevenue = paymentRepository.getTotalRevenue();
        if (totalRevenue == null) totalRevenue = 0.0;
        Double todayRevenue = paymentRepository.getRevenueSince(todayStart);
        if (todayRevenue == null) todayRevenue = 0.0;
        long pendingPayments = paymentRepository.countByStatus(PaymentStatus.PENDING);
        long completedPayments = paymentRepository.countByStatus(PaymentStatus.COMPLETED);
        long refundedPayments = paymentRepository.countByStatus(PaymentStatus.REFUNDED);

        // Wallet total balance
        Double totalWalletBalance = walletRepository.getTotalBalance();
        if (totalWalletBalance == null) totalWalletBalance = 0.0;

        // Top parkings by occupancy
        List<Parking> allParkings = parkingRepository.findAll();
        List<DashboardResponse.TopParkingDto> topByOccupancy = allParkings.stream()
                .map(p -> {
                    long pTotal = parkingSlotRepository.findByParkingId(p.getId()).size();
                    long pAvail = parkingSlotRepository.countByParkingIdAndStatus(p.getId(), SlotStatus.AVAILABLE);
                    long pOcc = parkingSlotRepository.countByParkingIdAndStatus(p.getId(), SlotStatus.OCCUPIED);
                    return DashboardResponse.TopParkingDto.builder()
                            .id(p.getId())
                            .name(p.getName())
                            .totalSlots(pTotal)
                            .availableSlots(pAvail)
                            .occupiedSlots(pOcc)
                            .build();
                })
                .sorted((a, b) -> Long.compare(b.getOccupiedSlots(), a.getOccupiedSlots()))
                .limit(5)
                .collect(Collectors.toList());

        // Top parkings by revenue
        List<Payment> allCompletedPayments = paymentRepository.findByStatus(PaymentStatus.COMPLETED);
        Map<String, Double> revenueByParking = new HashMap<>();
        Map<String, Long> reservationCountByParking = new HashMap<>();
        Map<String, Long> parkingIdByName = new HashMap<>();
        for (Payment payment : allCompletedPayments) {
            String parkingName = payment.getReservation().getParkingSlot().getParking().getName();
            Long parkingId = payment.getReservation().getParkingSlot().getParking().getId();
            revenueByParking.merge(parkingName, payment.getAmount(), Double::sum);
            reservationCountByParking.merge(parkingName, 1L, Long::sum);
            parkingIdByName.put(parkingName, parkingId);
        }

        List<DashboardResponse.TopParkingDto> topByRevenue = revenueByParking.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(10)
                .map(e -> DashboardResponse.TopParkingDto.builder()
                        .id(parkingIdByName.get(e.getKey()))
                        .name(e.getKey())
                        .revenue(e.getValue())
                        .reservationCount(reservationCountByParking.getOrDefault(e.getKey(), 0L))
                        .build())
                .collect(Collectors.toList());

        // Reservations per day (last 30 days)
        LocalDateTime thirtyDaysAgo = LocalDate.now().minusDays(29).atStartOfDay();
        List<Reservation> recentReservations = reservationRepository.findAll().stream()
                .filter(r -> r.getCreatedAt() != null && r.getCreatedAt().isAfter(thirtyDaysAgo))
                .collect(Collectors.toList());
        DateTimeFormatter dayFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        Map<String, Long> reservationsPerDay = new TreeMap<>();
        for (int i = 0; i < 30; i++) {
            reservationsPerDay.put(LocalDate.now().minusDays(29L - i).format(dayFmt), 0L);
        }
        for (Reservation r : recentReservations) {
            String key = r.getCreatedAt().toLocalDate().format(dayFmt);
            reservationsPerDay.merge(key, 1L, Long::sum);
        }

        // Revenue per day (last 30 days)
        Map<String, Double> revenuePerDay = new TreeMap<>();
        for (int i = 0; i < 30; i++) {
            revenuePerDay.put(LocalDate.now().minusDays(29L - i).format(dayFmt), 0.0);
        }
        for (Payment p : allCompletedPayments) {
            if (p.getPaidAt() != null && p.getPaidAt().isAfter(thirtyDaysAgo)) {
                String key = p.getPaidAt().toLocalDate().format(dayFmt);
                revenuePerDay.merge(key, p.getAmount(), Double::sum);
            }
        }

        // Payment method distribution
        Map<String, Long> paymentMethodDist = allCompletedPayments.stream()
                .filter(p -> p.getPaymentMethod() != null)
                .collect(Collectors.groupingBy(
                        p -> p.getPaymentMethod().name(),
                        Collectors.counting()
                ));

        return DashboardResponse.builder()
                .totalParkings(totalParkings)
                .totalSlots(totalSlots)
                .availableSlots(availableSlots)
                .occupiedSlots(occupiedSlots)
                .reservedSlots(reservedSlots)
                .maintenanceSlots(maintenanceSlots)
                .totalUsers(totalUsers)
                .adminUsers(adminUsers)
                .activeReservations(activeReservations)
                .completedReservations(completedReservations)
                .cancelledReservations(cancelledReservations)
                .todayReservations(todayReservations)
                .totalRevenue(totalRevenue)
                .todayRevenue(todayRevenue)
                .pendingPayments(pendingPayments)
                .completedPayments(completedPayments)
                .refundedPayments(refundedPayments)
                .totalWalletBalance(totalWalletBalance)
                .topParkingsByOccupancy(topByOccupancy)
                .topParkingsByRevenue(topByRevenue)
                .reservationsPerDay(reservationsPerDay)
                .revenuePerDay(revenuePerDay)
                .paymentMethodDistribution(paymentMethodDist)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        userRepository.delete(user);
    }

    @Override
    @Transactional
    public UserResponse changeUserRole(Long id, ChangeRoleRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        Role newRole;
        try {
            newRole = Role.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid role: " + request.getRole());
        }
        user.setRole(newRole);
        if (newRole == Role.GUARD) {
            if (request.getAssignedParkingId() != null) {
                Parking p = parkingRepository.findById(request.getAssignedParkingId())
                        .orElseThrow(() -> new ResourceNotFoundException("Parking not found"));
                user.setAssignedParking(p);
            } else {
                user.setAssignedParking(null);
            }
        } else {
            user.setAssignedParking(null);
        }
        userRepository.save(user);
        return toUserResponse(user);
    }

    private UserResponse toUserResponse(User user) {
        Long apId = user.getAssignedParking() != null ? user.getAssignedParking().getId() : null;
        String apName = user.getAssignedParking() != null ? user.getAssignedParking().getName() : null;
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .assignedParkingId(apId)
                .assignedParkingName(apName)
                .defaultVehiclePlate(user.getDefaultVehiclePlate())
                .createdAt(user.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminWalletResponse> getAllWallets() {
        return walletRepository.findAll().stream()
                .map(wallet -> AdminWalletResponse.builder()
                        .id(wallet.getId())
                        .userId(wallet.getUser().getId())
                        .fullName(wallet.getUser().getFullName())
                        .email(wallet.getUser().getEmail())
                        .balance(wallet.getBalance())
                        .updatedAt(wallet.getUpdatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<WalletTransactionResponse> getWalletTransactionsByUser(Long userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for user: " + userId));
        return walletTransactionRepository.findByWalletIdOrderByCreatedAtDesc(wallet.getId()).stream()
                .map(tx -> WalletTransactionResponse.builder()
                        .id(tx.getId())
                        .type(tx.getType().name())
                        .amount(tx.getAmount())
                        .description(tx.getDescription())
                        .cardLast4(tx.getCardLast4())
                        .createdAt(tx.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<WithdrawalResponse> getAllWithdrawals() {
        return withdrawalRequestRepository.findAll().stream()
                .map(this::mapWithdrawalToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<WithdrawalResponse> getPendingWithdrawals() {
        return withdrawalRequestRepository.findByStatus(WithdrawalStatus.PENDING).stream()
                .map(this::mapWithdrawalToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public WithdrawalResponse approveWithdrawal(Long withdrawalId) {
        WithdrawalRequest withdrawal = withdrawalRequestRepository.findById(withdrawalId)
                .orElseThrow(() -> new ResourceNotFoundException("Withdrawal request not found with id: " + withdrawalId));

        if (withdrawal.getStatus() != WithdrawalStatus.PENDING) {
            throw new BadRequestException("Only pending withdrawals can be approved");
        }

        withdrawal.setStatus(WithdrawalStatus.APPROVED);
        withdrawalRequestRepository.save(withdrawal);
        return mapWithdrawalToResponse(withdrawal);
    }

    @Override
    @Transactional
    public WithdrawalResponse rejectWithdrawal(Long withdrawalId) {
        WithdrawalRequest withdrawal = withdrawalRequestRepository.findById(withdrawalId)
                .orElseThrow(() -> new ResourceNotFoundException("Withdrawal request not found with id: " + withdrawalId));

        if (withdrawal.getStatus() != WithdrawalStatus.PENDING) {
            throw new BadRequestException("Only pending withdrawals can be rejected");
        }

        withdrawal.setStatus(WithdrawalStatus.REJECTED);
        withdrawalRequestRepository.save(withdrawal);
        return mapWithdrawalToResponse(withdrawal);
    }

    private WithdrawalResponse mapWithdrawalToResponse(WithdrawalRequest withdrawal) {
        return WithdrawalResponse.builder()
                .id(withdrawal.getId())
                .amount(withdrawal.getAmount())
                .status(withdrawal.getStatus().name())
                .createdAt(withdrawal.getCreatedAt())
                .build();
    }
}


