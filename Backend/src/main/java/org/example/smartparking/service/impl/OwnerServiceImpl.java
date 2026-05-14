package org.example.smartparking.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.smartparking.dto.request.GuardAssignRequest;
import org.example.smartparking.dto.request.ParkingRequest;
import org.example.smartparking.dto.request.ParkingSlotRequest;
import org.example.smartparking.dto.request.WithdrawRequest;
import org.example.smartparking.dto.response.*;
import org.example.smartparking.entity.*;
import org.example.smartparking.exception.BadRequestException;
import org.example.smartparking.exception.ResourceNotFoundException;
import org.example.smartparking.repository.*;
import org.example.smartparking.service.OwnerService;
import org.example.smartparking.service.ParkingGuardResponseHelper;
import org.example.smartparking.service.ParkingNameValidator;
import org.example.smartparking.util.OwnerParkingLayout;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OwnerServiceImpl implements OwnerService {

    private final ParkingRepository parkingRepository;
    private final ParkingSlotRepository parkingSlotRepository;
    private final ReservationRepository reservationRepository;
    private final PaymentRepository paymentRepository;
    private final WithdrawalRequestRepository withdrawalRequestRepository;
    private final UserRepository userRepository;
    private final ParkingNameValidator parkingNameValidator;
    private final ParkingGuardRepository parkingGuardRepository;
    private final ParkingGuardResponseHelper parkingGuardResponseHelper;
    private final ParkingReviewRepository parkingReviewRepository;
    private final ParkingPlateScanStatsRepository parkingPlateScanStatsRepository;

    // ─── Dashboard ──────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public OwnerDashboardResponse getDashboard(Long ownerId) {
        long totalParkings = parkingRepository.countByOwnerId(ownerId);
        long totalSlots = parkingSlotRepository.countByParkingOwnerId(ownerId);
        long activeReservations = reservationRepository.countActiveByOwnerId(ownerId);

        Double totalEarnings = paymentRepository.getTotalRevenueByOwnerId(ownerId);
        Double thisMonth = paymentRepository.getRevenueSinceByOwnerId(ownerId,
                LocalDate.now().withDayOfMonth(1).atStartOfDay());
        Double today = paymentRepository.getRevenueSinceByOwnerId(ownerId,
                LocalDate.now().atStartOfDay());

        LocalDate statDate = LocalDate.now();
        long appUsersToday = parkingPlateScanStatsRepository.sumAppUsersByOwnerAndDate(ownerId, statDate);
        long nonAppUsersToday = parkingPlateScanStatsRepository.sumNonAppUsersByOwnerAndDate(ownerId, statDate);

        return OwnerDashboardResponse.builder()
                .totalParkings(totalParkings)
                .totalSlots(totalSlots)
                .activeReservations(activeReservations)
                .totalEarnings(totalEarnings)
                .thisMonthEarnings(thisMonth)
                .todayEarnings(today)
                .appUsersToday(appUsersToday)
                .nonAppUsersToday(nonAppUsersToday)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public OwnerDashboardResponse getDashboardForAdmin() {
        long totalParkings = parkingRepository.count();
        long totalSlots = parkingSlotRepository.count();
        long activeReservations = reservationRepository.countActiveReservations();

        Double totalEarnings = paymentRepository.getTotalRevenue();
        Double thisMonth = paymentRepository.getRevenueSince(
                LocalDate.now().withDayOfMonth(1).atStartOfDay());
        Double today = paymentRepository.getRevenueSince(
                LocalDate.now().atStartOfDay());

        // Admin dashboard: we don't have an "all owners" aggregation query; keep 0 for now.
        long appUsersToday = 0;
        long nonAppUsersToday = 0;

        return OwnerDashboardResponse.builder()
                .totalParkings(totalParkings)
                .totalSlots(totalSlots)
                .activeReservations(activeReservations)
                .totalEarnings(totalEarnings)
                .thisMonthEarnings(thisMonth)
                .todayEarnings(today)
                .appUsersToday(appUsersToday)
                .nonAppUsersToday(nonAppUsersToday)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public EarningsResponse getEarnings(Long ownerId) {
        Double total = paymentRepository.getTotalRevenueByOwnerId(ownerId);
        Double thisMonth = paymentRepository.getRevenueSinceByOwnerId(ownerId,
                LocalDate.now().withDayOfMonth(1).atStartOfDay());
        Double today = paymentRepository.getRevenueSinceByOwnerId(ownerId,
                LocalDate.now().atStartOfDay());
        Double totalWithdrawn = withdrawalRequestRepository.getTotalWithdrawnByOwnerId(ownerId);
        Double available = total - totalWithdrawn;

        return EarningsResponse.builder()
                .totalEarnings(total)
                .thisMonthEarnings(thisMonth)
                .todayEarnings(today)
                .availableForWithdrawal(available)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public EarningsResponse getEarningsForAdmin() {
        Double total = paymentRepository.getTotalRevenue();
        Double thisMonth = paymentRepository.getRevenueSince(
                LocalDate.now().withDayOfMonth(1).atStartOfDay());
        Double today = paymentRepository.getRevenueSince(
                LocalDate.now().atStartOfDay());
        Double totalWithdrawn = withdrawalRequestRepository.getTotalWithdrawn();
        Double available = total - totalWithdrawn;

        return EarningsResponse.builder()
                .totalEarnings(total)
                .thisMonthEarnings(thisMonth)
                .todayEarnings(today)
                .availableForWithdrawal(available)
                .build();
    }
    // ─── Parking Management ─────────────────────────────────

    @Override
    @Transactional
    public ParkingResponse createParking(Long ownerId, ParkingRequest request) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Owner not found"));

        String name = request.getName().trim();
        parkingNameValidator.assertUniqueName(name, null);

        boolean hasFloors = request.getLayoutFloors() != null;
        boolean hasSpots = request.getLayoutSpotsPerFloor() != null;
        if (hasFloors != hasSpots) {
            throw new BadRequestException("Provide both layoutFloors and layoutSpotsPerFloor, or neither");
        }
        boolean layout = hasFloors;
        int totalSlots;
        if (layout) {
            totalSlots = OwnerParkingLayout.computeTotalSlots(request.getLayoutFloors(), request.getLayoutSpotsPerFloor());
            if (request.getTotalSlots() != null && !request.getTotalSlots().equals(totalSlots)) {
                throw new BadRequestException("totalSlots must equal layoutFloors × layoutSpotsPerFloor (" + totalSlots + ")");
            }
        } else {
            if (request.getTotalSlots() == null || request.getTotalSlots() < 1) {
                throw new BadRequestException("totalSlots is required when layout is not specified");
            }
            totalSlots = request.getTotalSlots();
        }

        PricingTier tier = parsePricingTier(request.getPricingTier());
        Parking parking = Parking.builder()
                .name(name)
                .address(request.getAddress())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .totalSlots(totalSlots)
                .pricePerHour(request.getPricePerHour())
                .pricingTier(tier)
                .dailyCapPrice(request.getDailyCapPrice())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .layoutFloors(request.getLayoutFloors())
                .layoutSpotsPerFloor(request.getLayoutSpotsPerFloor())
                .undergroundFloors(request.getUndergroundFloors())
                .active(true)
                .owner(owner)
                .build();

        parking = parkingRepository.save(parking);

        if (layout) {
            List<ParkingSlot> slots = OwnerParkingLayout.generateSlots(
                    parking,
                    request.getLayoutFloors(),
                    request.getLayoutSpotsPerFloor(),
                    Boolean.TRUE.equals(request.getUndergroundFloors()));
            parkingSlotRepository.saveAll(slots);
        }

        if (request.getGuardUserIds() != null && !request.getGuardUserIds().isEmpty()) {
            persistGuardLinks(parking, request.getGuardUserIds());
        }

        return mapParkingToResponse(parking);
    }

    @Override
    @Transactional
    public ParkingResponse updateParking(Long ownerId, Long parkingId, ParkingRequest request) {
        Parking parking = getOwnedParking(ownerId, parkingId);

        String name = request.getName().trim();
        parkingNameValidator.assertUniqueName(name, parkingId);
        parking.setName(name);
        parking.setAddress(request.getAddress());
        parking.setDescription(request.getDescription());
        parking.setImageUrl(request.getImageUrl());
        boolean hasFloors = request.getLayoutFloors() != null;
        boolean hasSpots = request.getLayoutSpotsPerFloor() != null;
        int totalSlots;
        if (hasFloors && hasSpots) {
            totalSlots = OwnerParkingLayout.computeTotalSlots(request.getLayoutFloors(), request.getLayoutSpotsPerFloor());
            if (request.getTotalSlots() != null && !request.getTotalSlots().equals(totalSlots)) {
                throw new BadRequestException("totalSlots must equal layoutFloors × layoutSpotsPerFloor (" + totalSlots + ")");
            }
        } else {
            if (!hasFloors && hasSpots) {
                throw new BadRequestException("layoutSpotsPerFloor requires layoutFloors");
            }
            if (request.getTotalSlots() == null || request.getTotalSlots() < 1) {
                throw new BadRequestException("totalSlots is required");
            }
            totalSlots = request.getTotalSlots();
        }
        parking.setTotalSlots(totalSlots);
        parking.setPricePerHour(request.getPricePerHour());
        if (request.getPricingTier() != null && !request.getPricingTier().isBlank()) {
            parking.setPricingTier(parsePricingTier(request.getPricingTier()));
        }
        if (request.getDailyCapPrice() != null) {
            parking.setDailyCapPrice(request.getDailyCapPrice());
        }
        parking.setLatitude(request.getLatitude());
        parking.setLongitude(request.getLongitude());
        parking.setLayoutFloors(request.getLayoutFloors());
        parking.setLayoutSpotsPerFloor(request.getLayoutSpotsPerFloor());
        parking.setUndergroundFloors(request.getUndergroundFloors());

        parking = parkingRepository.save(parking);
        return mapParkingToResponse(parking);
    }

    private static PricingTier parsePricingTier(String raw) {
        if (raw == null || raw.isBlank()) {
            return PricingTier.STANDARD;
        }
        try {
            return PricingTier.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return PricingTier.STANDARD;
        }
    }

    @Override
    @Transactional
    public void deleteParking(Long ownerId, Long parkingId) {
        Parking parking = getOwnedParking(ownerId, parkingId);
        parkingRepository.delete(parking);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ParkingResponse> getMyParkings(Long ownerId) {
        return parkingRepository.findByOwnerId(ownerId).stream()
                .map(this::mapParkingToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ParkingResponse getMyParkingById(Long ownerId, Long parkingId) {
        Parking parking = getOwnedParking(ownerId, parkingId);
        return mapParkingToResponse(parking);
    }

    @Override
    @Transactional
    public ParkingResponse assignGuards(Long ownerId, Long parkingId, GuardAssignRequest request) {
        Parking parking = getOwnedParking(ownerId, parkingId);
        List<Long> ids = request.getGuardUserIds() != null ? request.getGuardUserIds() : List.of();
        persistGuardLinks(parking, ids);
        return mapParkingToResponse(parking);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ParkingGuardSummary> listGuardCandidates() {
        return userRepository.findByRoleOrderByFullNameAsc(Role.GUARD).stream()
                .map(u -> ParkingGuardSummary.builder()
                        .id(u.getId())
                        .fullName(u.getFullName())
                        .email(u.getEmail())
                        .build())
                .collect(Collectors.toList());
    }

    private void persistGuardLinks(Parking parking, List<Long> guardUserIds) {
        Long pid = parking.getId();
        parkingGuardRepository.deleteByParking_Id(pid);
        if (guardUserIds == null || guardUserIds.isEmpty()) {
            return;
        }
        Set<Long> unique = new LinkedHashSet<>(guardUserIds);
        for (Long gid : unique) {
            if (gid == null) {
                continue;
            }
            User g = userRepository.findById(gid)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + gid));
            if (g.getRole() != Role.GUARD) {
                throw new BadRequestException("User " + g.getEmail() + " is not a guard");
            }
            parkingGuardRepository.save(ParkingGuard.builder().parking(parking).user(g).build());
        }
    }

    // ─── Slot Management ────────────────────────────────────

    @Override
    @Transactional
    public ParkingSlotResponse addSlot(Long ownerId, Long parkingId, ParkingSlotRequest request) {
        Parking parking = getOwnedParking(ownerId, parkingId);

        ParkingSlot slot = ParkingSlot.builder()
                .slotNumber(request.getSlotNumber())
                .slotType(request.getSlotType() != null ? request.getSlotType() : SlotType.STANDARD)
                .floor(request.getFloor())
                .status(SlotStatus.AVAILABLE)
                .parking(parking)
                .build();

        slot = parkingSlotRepository.save(slot);
        return mapSlotToResponse(slot);
    }

    @Override
    @Transactional
    public ParkingSlotResponse updateSlot(Long ownerId, Long slotId, ParkingSlotRequest request) {
        ParkingSlot slot = parkingSlotRepository.findById(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found with id: " + slotId));

        verifyOwnership(ownerId, slot.getParking());

        slot.setSlotNumber(request.getSlotNumber());
        slot.setSlotType(request.getSlotType() != null ? request.getSlotType() : slot.getSlotType());
        slot.setFloor(request.getFloor());
        if (request.getStatus() != null) {
            slot.setStatus(request.getStatus());
        }

        slot = parkingSlotRepository.save(slot);
        return mapSlotToResponse(slot);
    }

    @Override
    @Transactional
    public void deleteSlot(Long ownerId, Long slotId) {
        ParkingSlot slot = parkingSlotRepository.findById(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found with id: " + slotId));

        verifyOwnership(ownerId, slot.getParking());
        parkingSlotRepository.delete(slot);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ParkingSlotResponse> getSlotsByParking(Long ownerId, Long parkingId) {
        getOwnedParking(ownerId, parkingId); // verify ownership
        return parkingSlotRepository.findByParkingId(parkingId).stream()
                .map(this::mapSlotToResponse)
                .collect(Collectors.toList());
    }

    // ─── Reservations ───────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<ReservationResponse> getMyReservations(Long ownerId) {
        return reservationRepository.findByOwnerIdWithDetails(ownerId).stream()
                .map(this::mapReservationToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReservationResponse> getReservationsForAdmin() {
        return reservationRepository.findAllWithDetails().stream()
                .map(this::mapReservationToResponse)
                .collect(Collectors.toList());
    }

    // ─── Withdrawals ────────────────────────────────────────

    @Override
    @Transactional
    public WithdrawalResponse requestWithdrawal(Long ownerId, WithdrawRequest request) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Owner not found"));

        Double totalEarnings = paymentRepository.getTotalRevenueByOwnerId(ownerId);
        Double totalWithdrawn = withdrawalRequestRepository.getTotalWithdrawnByOwnerId(ownerId);
        Double availableForWithdrawal = totalEarnings - totalWithdrawn;

        if (request.getAmount() > availableForWithdrawal) {
            throw new BadRequestException("Withdrawal amount exceeds available earnings. Available: " + availableForWithdrawal + " MAD");
        }

        WithdrawalRequest withdrawal = WithdrawalRequest.builder()
                .owner(owner)
                .amount(request.getAmount())
                .status(WithdrawalStatus.PENDING)
                .build();

        withdrawal = withdrawalRequestRepository.save(withdrawal);
        return mapWithdrawalToResponse(withdrawal);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WithdrawalResponse> getMyWithdrawals(Long ownerId) {
        return withdrawalRequestRepository.findByOwnerId(ownerId).stream()
                .map(this::mapWithdrawalToResponse)
                .collect(Collectors.toList());
    }

    // ─── Helpers ────────────────────────────────────────────

    private Parking getOwnedParking(Long ownerId, Long parkingId) {
        Parking parking = parkingRepository.findById(parkingId)
                .orElseThrow(() -> new ResourceNotFoundException("Parking not found with id: " + parkingId));
        verifyOwnership(ownerId, parking);
        return parking;
    }

    private void verifyOwnership(Long ownerId, Parking parking) {
        if (parking.getOwner() == null || !parking.getOwner().getId().equals(ownerId)) {
            throw new BadRequestException("You do not own this parking");
        }
    }

    private ParkingResponse mapParkingToResponse(Parking parking) {
        long availableSlots = parkingSlotRepository.countByParkingIdAndStatus(
                parking.getId(), SlotStatus.AVAILABLE);
        Double avgRating = parkingReviewRepository.getAvgRating(parking.getId());
        long reviewCount = parkingReviewRepository.countByParkingId(parking.getId());

        ParkingResponse.ParkingResponseBuilder b = ParkingResponse.builder()
                .id(parking.getId())
                .name(parking.getName())
                .address(parking.getAddress())
                .description(parking.getDescription())
                .imageUrl(parking.getImageUrl())
                .totalSlots(parking.getTotalSlots())
                .availableSlots(availableSlots)
                .pricePerHour(parking.getPricePerHour())
                .pricingTier(parking.getPricingTier() != null ? parking.getPricingTier().name() : null)
                .dailyCapPrice(parking.getDailyCapPrice())
                .layoutFloors(parking.getLayoutFloors())
                .layoutSpotsPerFloor(parking.getLayoutSpotsPerFloor())
                .undergroundFloors(parking.getUndergroundFloors())
                .avgRating(avgRating != null ? avgRating : 0.0)
                .reviewCount(reviewCount)
                .active(parking.getActive())
                .latitude(parking.getLatitude())
                .longitude(parking.getLongitude())
                .ownerId(parking.getOwner() != null ? parking.getOwner().getId() : null)
                .ownerName(parking.getOwner() != null ? parking.getOwner().getFullName() : null)
                .createdAt(parking.getCreatedAt());

        parkingGuardResponseHelper.applyGuardFields(b, parking.getId());
        return b.build();
    }

    private ParkingSlotResponse mapSlotToResponse(ParkingSlot slot) {
        return ParkingSlotResponse.builder()
                .id(slot.getId())
                .slotNumber(slot.getSlotNumber())
                .status(slot.getStatus().name())
                .slotType(slot.getSlotType().name())
                .floor(slot.getFloor())
                .parkingId(slot.getParking().getId())
                .parkingName(slot.getParking().getName())
                .createdAt(slot.getCreatedAt())
                .build();
    }

    private ReservationResponse mapReservationToResponse(Reservation reservation) {
        String paymentStatus = null;
        String paymentMethod = null;
        if (reservation.getPayment() != null) {
            paymentStatus = reservation.getPayment().getStatus().name();
            if (reservation.getPayment().getPaymentMethod() != null) {
                paymentMethod = reservation.getPayment().getPaymentMethod().name();
            }
        }
        return ReservationResponse.builder()
                .id(reservation.getId())
                .userId(reservation.getUser().getId())
                .userFullName(reservation.getUser().getFullName())
                .parkingSlotId(reservation.getParkingSlot().getId())
                .slotNumber(reservation.getParkingSlot().getSlotNumber())
                .parkingName(reservation.getParkingSlot().getParking().getName())
                .startTime(reservation.getStartTime())
                .endTime(reservation.getEndTime())
                .status(reservation.getStatus().name())
                .totalPrice(reservation.getTotalPrice())
                .paymentStatus(paymentStatus)
                .paymentMethod(paymentMethod)
                .createdAt(reservation.getCreatedAt())
                .build();
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
