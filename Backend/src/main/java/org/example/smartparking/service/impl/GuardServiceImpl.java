package org.example.smartparking.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.smartparking.dto.response.GuardScanResultResponse;
import org.example.smartparking.dto.response.GuardPlateEntryResponse;
import org.example.smartparking.dto.response.GuardPlateExitResponse;
import org.example.smartparking.dto.response.GuardPlateLookupResponse;
import org.example.smartparking.dto.response.GuardPlateScanFlowResponse;
import org.example.smartparking.dto.response.PlateOcrResponse;
import org.example.smartparking.dto.response.ReservationResponse;
import org.example.smartparking.dto.response.WalkInSessionResponse;
import org.example.smartparking.entity.*;
import org.example.smartparking.exception.BadRequestException;
import org.example.smartparking.exception.ResourceNotFoundException;
import org.example.smartparking.repository.ParkingRepository;
import org.example.smartparking.repository.ParkingGuardRepository;
import org.example.smartparking.repository.ParkingSlotRepository;
import org.example.smartparking.repository.ReservationRepository;
import org.example.smartparking.repository.UserRepository;
import org.example.smartparking.repository.WalkInParkingSessionRepository;
import org.example.smartparking.service.AlprClient;
import org.example.smartparking.service.GuardService;
import org.example.smartparking.service.ReservationQrService;
import org.example.smartparking.service.ReservationService;
import org.example.smartparking.util.PlateNormalizer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GuardServiceImpl implements GuardService {

    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final ParkingRepository parkingRepository;
    private final ParkingGuardRepository parkingGuardRepository;
    private final ParkingSlotRepository parkingSlotRepository;
    private final WalkInParkingSessionRepository walkInParkingSessionRepository;
    private final ReservationQrService reservationQrService;
    private final ReservationService reservationService;
    private final AlprClient alprClient;

    /**
     * Minimum OCR confidence (0.0 – 1.0) required to auto-accept the read plate
     * for matching/walk-in flows. Reads below this threshold are returned to
     * the guard with a "low confidence" message so they can retake or type the
     * plate manually — this prevents starting walk-ins for the wrong vehicle.
     */
    @Value("${app.alpr.min-confidence:0.55}")
    private double minOcrConfidence;

    @Override
    @Transactional
    public GuardScanResultResponse validateEntry(String qrPayload, String guardEmail) {
        try {
            ReservationQrService.QrPayload p = reservationQrService.verifyAndParse(qrPayload);
            return processEntry(p.reservationId(), p.parkingId(), p.validFrom(), p.validUntil(), guardEmail, true);
        } catch (RuntimeException e) {
            return GuardScanResultResponse.builder()
                    .valid(false)
                    .message(e.getMessage() != null ? e.getMessage() : "Invalid QR")
                    .build();
        }
    }

    @Override
    @Transactional
    public GuardScanResultResponse validateExit(String qrPayload, String guardEmail) {
        try {
            ReservationQrService.QrPayload p = reservationQrService.verifyAndParse(qrPayload);
            return processExit(p.reservationId(), p.parkingId(), guardEmail, true);
        } catch (RuntimeException e) {
            return GuardScanResultResponse.builder()
                    .valid(false)
                    .message(e.getMessage() != null ? e.getMessage() : "Invalid QR")
                    .build();
        }
    }

    @Override
    @Transactional
    public GuardScanResultResponse validateEntryByReservationId(Long reservationId, String guardEmail) {
        Reservation r = reservationRepository.findByIdWithDetails(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));
        long parkingId = r.getParkingSlot().getParking().getId();
        LocalDateTime vf = r.getStartTime().minusMinutes(15);
        LocalDateTime vu = r.getEndTime().plusMinutes(15);
        return processEntry(reservationId, parkingId, vf, vu, guardEmail, false);
    }

    @Override
    @Transactional
    public GuardScanResultResponse validateExitByReservationId(Long reservationId, String guardEmail) {
        Reservation r = reservationRepository.findByIdWithDetails(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));
        long parkingId = r.getParkingSlot().getParking().getId();
        return processExit(reservationId, parkingId, guardEmail, false);
    }

    private GuardScanResultResponse processEntry(long reservationId, long parkingId, LocalDateTime vf, LocalDateTime vu,
                                                 String guardEmail, boolean verifyPayloadIds) {
        User guard = loadGuardOrAdmin(guardEmail);
        assertGuardParking(guard, parkingId);

        Reservation r = reservationRepository.findByIdWithDetails(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));

        if (verifyPayloadIds) {
            if (r.getParkingSlot().getParking().getId() != parkingId) {
                return fail("Parking mismatch");
            }
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(vf) || now.isAfter(vu)) {
            return fail("Outside valid entry window");
        }
        if (r.getStatus() != ReservationStatus.ACTIVE) {
            return fail("Reservation is not active");
        }
        if (Boolean.TRUE.equals(r.getCheckedIn())) {
            return fail("Already checked in");
        }

        r.setCheckedIn(true);
        r.setActualArrival(now);
        reservationRepository.save(r);

        ReservationResponse dto = reservationService.getReservationById(r.getId());
        return GuardScanResultResponse.builder()
                .valid(true)
                .message("Entry allowed")
                .reservation(dto)
                .build();
    }

    private GuardScanResultResponse processExit(long reservationId, long parkingId, String guardEmail, boolean verifyParking) {
        User guard = loadGuardOrAdmin(guardEmail);
        assertGuardParking(guard, parkingId);

        Reservation r = reservationRepository.findByIdWithDetails(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));

        if (verifyParking && r.getParkingSlot().getParking().getId() != parkingId) {
            return fail("Parking mismatch");
        }

        if (!Boolean.TRUE.equals(r.getCheckedIn())) {
            return fail("Not checked in yet");
        }
        if (Boolean.TRUE.equals(r.getCheckedOut())) {
            return fail("Already checked out");
        }

        r.setCheckedOut(true);
        r.setActualDeparture(LocalDateTime.now());
        reservationRepository.save(r);

        ReservationResponse dto = reservationService.getReservationById(r.getId());
        return GuardScanResultResponse.builder()
                .valid(true)
                .message("Exit recorded")
                .reservation(dto)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReservationResponse> listActiveBookingsForParking(Long parkingId, String guardEmail) {
        User guard = loadGuardOrAdmin(guardEmail);
        assertGuardParking(guard, parkingId);

        LocalDate today = LocalDate.now();
        LocalDateTime dayStart = today.atStartOfDay();
        LocalDateTime dayEnd = today.plusDays(1).atStartOfDay();

        return reservationRepository.findActiveForParkingOverlappingInterval(parkingId, dayStart, dayEnd).stream()
                .map(r -> reservationService.getReservationById(r.getId()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void manualOccupySlot(Long slotId, String guardEmail) {
        User guard = loadGuardOrAdmin(guardEmail);
        ParkingSlot slot = parkingSlotRepository.findByIdForUpdate(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found"));
        assertGuardParking(guard, slot.getParking().getId());

        if (slot.getStatus() != SlotStatus.AVAILABLE) {
            throw new BadRequestException("Slot is not available for manual occupy");
        }
        slot.setStatus(SlotStatus.OCCUPIED);
        parkingSlotRepository.save(slot);
    }

    @Override
    @Transactional
    public void manualFreeSlot(Long slotId, String guardEmail) {
        User guard = loadGuardOrAdmin(guardEmail);
        ParkingSlot slot = parkingSlotRepository.findByIdForUpdate(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found"));
        assertGuardParking(guard, slot.getParking().getId());

        if (slot.getStatus() != SlotStatus.OCCUPIED) {
            throw new BadRequestException("Slot is not manually occupied");
        }
        slot.setStatus(SlotStatus.AVAILABLE);
        parkingSlotRepository.save(slot);
    }

    @Override
    public PlateOcrResponse readPlate(byte[] imageBytes, String filename) {
        if (imageBytes == null || imageBytes.length == 0) {
            return PlateOcrResponse.builder()
                    .message("Empty image — please retake the photo")
                    .confidence(0.0)
                    .build();
        }
        if (!alprClient.isConfigured()) {
            return PlateOcrResponse.builder()
                    .message("Plate OCR is not configured")
                    .confidence(0.0)
                    .build();
        }
        Optional<AlprClient.PlateRead> read = alprClient.readPlate(imageBytes, filename);
        return read.map(p -> PlateOcrResponse.builder()
                        .plate(p.plate())
                        .confidence(p.confidence())
                        .message(p.confidence() < minOcrConfidence
                                ? "Low confidence read — please retake or type the plate manually"
                                : "Plate read successfully")
                        .build())
                .orElseGet(() -> PlateOcrResponse.builder()
                        .message("No license plate detected")
                        .confidence(0.0)
                        .build());
    }

    @Override
    @Transactional
    public GuardPlateScanFlowResponse scanPlate(Long parkingId, byte[] imageBytes, String filename, String guardEmail) {
        User guard = loadGuardOrAdmin(guardEmail);
        assertGuardParking(guard, parkingId);

        PlateOcrResponse ocr = readPlate(imageBytes, filename);
        String normalized = normalizePlate(ocr.getPlate());

        // Refuse to look up a booking with a low-confidence read — a wrong
        // match here would let the wrong driver into a paid slot.
        boolean lowConfidence = ocr.getPlate() != null
                && ocr.getConfidence() != null
                && ocr.getConfidence() < minOcrConfidence;

        if (normalized == null || lowConfidence) {
            return GuardPlateScanFlowResponse.builder()
                    .plate(ocr.getPlate())
                    .confidence(ocr.getConfidence())
                    .isAppUser(false)
                    .message(ocr.getMessage() != null ? ocr.getMessage() : "No license plate detected")
                    .appUsersToday(countAppBookingsToday(parkingId))
                    .nonAppUsersToday(countActiveWalkIns(parkingId))
                    .build();
        }

        Optional<Reservation> match = findActiveReservationByPlate(parkingId, normalized);
        if (match.isPresent()) {
            return GuardPlateScanFlowResponse.builder()
                    .plate(normalized)
                    .confidence(ocr.getConfidence())
                    .isAppUser(true)
                    .message("Active app reservation found for this plate")
                    .reservation(reservationService.getReservationById(match.get().getId()))
                    .appUsersToday(countAppBookingsToday(parkingId))
                    .nonAppUsersToday(countActiveWalkIns(parkingId))
                    .build();
        }

        return GuardPlateScanFlowResponse.builder()
                .plate(normalized)
                .confidence(ocr.getConfidence())
                .isAppUser(false)
                .message("No active app reservation found. Use Plate entry to start a walk-in session if needed.")
                .appUsersToday(countAppBookingsToday(parkingId))
                .nonAppUsersToday(countActiveWalkIns(parkingId))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public GuardPlateLookupResponse lookupPlate(Long parkingId, String plate, String guardEmail) {
        User guard = loadGuardOrAdmin(guardEmail);
        assertGuardParking(guard, parkingId);
        String normalized = requireNormalizedPlate(plate);
        Optional<Reservation> match = findActiveReservationByPlate(parkingId, normalized);
        return match.map(r -> GuardPlateLookupResponse.builder()
                        .found(true)
                        .plateNormalized(normalized)
                        .message("Active app reservation found")
                        .reservation(reservationService.getReservationById(r.getId()))
                        .build())
                .orElseGet(() -> GuardPlateLookupResponse.builder()
                        .found(false)
                        .plateNormalized(normalized)
                        .message("No active app reservation found")
                        .build());
    }

    @Override
    @Transactional
    public GuardPlateEntryResponse plateEntry(Long parkingId, String plate, Long parkingSlotId, String notes, String guardEmail) {
        User guard = loadGuardOrAdmin(guardEmail);
        assertGuardParking(guard, parkingId);
        String normalized = requireNormalizedPlate(plate);

        Optional<Reservation> match = findActiveReservationByPlate(parkingId, normalized);
        if (match.isPresent()) {
            Reservation r = match.get();
            GuardScanResultResponse entry = processEntry(
                    r.getId(), parkingId, r.getStartTime().minusMinutes(15), r.getEndTime().plusMinutes(15), guardEmail, false);
            return GuardPlateEntryResponse.builder()
                    .success(entry.isValid())
                    .outcome(entry.isValid() ? "RESERVATION_CHECKED_IN" : "REJECTED")
                    .message(entry.getMessage())
                    .reservation(entry.getReservation())
                    .build();
        }

        if (walkInParkingSessionRepository.findByParking_IdAndPlateNormalizedAndStatus(
                parkingId, normalized, WalkInSessionStatus.ACTIVE).isPresent()) {
            return GuardPlateEntryResponse.builder()
                    .success(false)
                    .outcome("REJECTED")
                    .message("A walk-in session is already active for this plate")
                    .build();
        }

        Parking parking = parkingRepository.findById(parkingId)
                .orElseThrow(() -> new ResourceNotFoundException("Parking not found"));
        ParkingSlot slot = null;
        if (parkingSlotId != null) {
            slot = parkingSlotRepository.findByIdForUpdate(parkingSlotId)
                    .orElseThrow(() -> new ResourceNotFoundException("Slot not found"));
            if (!slot.getParking().getId().equals(parkingId)) {
                throw new BadRequestException("Slot does not belong to this parking");
            }
            if (slot.getStatus() != SlotStatus.AVAILABLE) {
                throw new BadRequestException("Selected slot is not available");
            }
            slot.setStatus(SlotStatus.OCCUPIED);
            parkingSlotRepository.save(slot);
        }

        WalkInParkingSession session = WalkInParkingSession.builder()
                .parking(parking)
                .parkingSlot(slot)
                .plateRaw(plate)
                .plateNormalized(normalized)
                .entryTime(LocalDateTime.now())
                .status(WalkInSessionStatus.ACTIVE)
                .pricePerHourSnapshot(parking.getPricePerHour())
                .entryGuard(guard)
                .notes(notes)
                .build();
        session = walkInParkingSessionRepository.save(session);

        return GuardPlateEntryResponse.builder()
                .success(true)
                .outcome("WALK_IN_STARTED")
                .message("Walk-in session started")
                .walkIn(mapWalkIn(session))
                .build();
    }

    @Override
    @Transactional
    public GuardPlateExitResponse plateExit(Long parkingId, String plate, Boolean paidOnExit, String guardEmail) {
        User guard = loadGuardOrAdmin(guardEmail);
        assertGuardParking(guard, parkingId);
        String normalized = requireNormalizedPlate(plate);

        Optional<Reservation> match = findActiveReservationByPlate(parkingId, normalized);
        if (match.isPresent()) {
            Reservation r = match.get();
            GuardScanResultResponse exit = processExit(r.getId(), parkingId, guardEmail, false);
            return GuardPlateExitResponse.builder()
                    .success(exit.isValid())
                    .outcome(exit.isValid() ? "RESERVATION_EXIT" : "REJECTED")
                    .message(exit.getMessage())
                    .reservation(exit.getReservation())
                    .build();
        }

        WalkInParkingSession session = walkInParkingSessionRepository.findByParking_IdAndPlateNormalizedAndStatus(
                        parkingId, normalized, WalkInSessionStatus.ACTIVE)
                .orElse(null);
        if (session == null) {
            return GuardPlateExitResponse.builder()
                    .success(false)
                    .outcome("REJECTED")
                    .message("No active app reservation or walk-in session found for this plate")
                    .build();
        }

        LocalDateTime now = LocalDateTime.now();
        session.setExitTime(now);
        session.setExitGuard(guard);
        session.setAmountDue(calculateWalkInAmount(session.getEntryTime(), now, session.getPricePerHourSnapshot()));
        session.setStatus(Boolean.TRUE.equals(paidOnExit) ? WalkInSessionStatus.COMPLETED : WalkInSessionStatus.UNPAID);
        if (session.getParkingSlot() != null && session.getParkingSlot().getStatus() == SlotStatus.OCCUPIED) {
            session.getParkingSlot().setStatus(SlotStatus.AVAILABLE);
            parkingSlotRepository.save(session.getParkingSlot());
        }
        session = walkInParkingSessionRepository.save(session);

        return GuardPlateExitResponse.builder()
                .success(true)
                .outcome("WALK_IN_EXIT")
                .message(Boolean.TRUE.equals(paidOnExit)
                        ? "Walk-in exit recorded and marked paid"
                        : "Walk-in exit recorded. Payment still due")
                .walkIn(mapWalkIn(session))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<WalkInSessionResponse> listActiveWalkIns(Long parkingId, String guardEmail) {
        User guard = loadGuardOrAdmin(guardEmail);
        assertGuardParking(guard, parkingId);
        return walkInParkingSessionRepository.findByParking_IdAndStatusOrderByEntryTimeDesc(
                        parkingId, WalkInSessionStatus.ACTIVE).stream()
                .map(this::mapWalkIn)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void markWalkInPaid(Long sessionId, String guardEmail) {
        User guard = loadGuardOrAdmin(guardEmail);
        WalkInParkingSession session = walkInParkingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Walk-in session not found"));
        assertGuardParking(guard, session.getParking().getId());
        if (session.getStatus() != WalkInSessionStatus.UNPAID && session.getStatus() != WalkInSessionStatus.COMPLETED) {
            throw new BadRequestException("Only exited walk-in sessions can be marked paid");
        }
        session.setStatus(WalkInSessionStatus.COMPLETED);
        walkInParkingSessionRepository.save(session);
    }

    private User loadGuardOrAdmin(String email) {
        User u = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (u.getRole() != Role.GUARD && u.getRole() != Role.ADMIN) {
            throw new BadRequestException("Only guards can perform this action");
        }
        return u;
    }

    private void assertGuardParking(User guard, long parkingId) {
        if (guard.getRole() == Role.ADMIN) {
            return;
        }
        if (parkingGuardRepository.existsByParking_IdAndUser_Id(parkingId, guard.getId())) {
            return;
        }
        if (guard.getAssignedParking() != null
                && guard.getAssignedParking().getId().equals(parkingId)) {
            return;
        }
        throw new BadRequestException("You are not assigned to this parking");
    }

    private static GuardScanResultResponse fail(String msg) {
        return GuardScanResultResponse.builder().valid(false).message(msg).build();
    }

    private Optional<Reservation> findActiveReservationByPlate(Long parkingId, String normalizedPlate) {
        LocalDate today = LocalDate.now();
        LocalDateTime dayStart = today.atStartOfDay();
        LocalDateTime dayEnd = today.plusDays(1).atStartOfDay();
        return reservationRepository.findActiveForParkingAndPlateOverlappingInterval(
                        parkingId, normalizedPlate, dayStart, dayEnd).stream()
                .findFirst();
    }

    private long countAppBookingsToday(Long parkingId) {
        LocalDate today = LocalDate.now();
        return reservationRepository.findActiveForParkingOverlappingInterval(
                parkingId, today.atStartOfDay(), today.plusDays(1).atStartOfDay()).size();
    }

    private long countActiveWalkIns(Long parkingId) {
        return walkInParkingSessionRepository.findByParking_IdAndStatusOrderByEntryTimeDesc(
                parkingId, WalkInSessionStatus.ACTIVE).size();
    }

    private WalkInSessionResponse mapWalkIn(WalkInParkingSession session) {
        ParkingSlot slot = session.getParkingSlot();
        return WalkInSessionResponse.builder()
                .id(session.getId())
                .parkingId(session.getParking().getId())
                .parkingName(session.getParking().getName())
                .parkingSlotId(slot != null ? slot.getId() : null)
                .slotNumber(slot != null ? slot.getSlotNumber() : null)
                .plateNormalized(session.getPlateNormalized())
                .plateRaw(session.getPlateRaw())
                .entryTime(session.getEntryTime())
                .exitTime(session.getExitTime())
                .status(session.getStatus().name())
                .pricePerHourSnapshot(session.getPricePerHourSnapshot())
                .amountDue(session.getAmountDue())
                .build();
    }

    private static Double calculateWalkInAmount(LocalDateTime entry, LocalDateTime exit, Double pricePerHour) {
        long minutes = Math.max(1, Duration.between(entry, exit).toMinutes());
        long hours = Math.max(1, (long) Math.ceil(minutes / 60.0));
        return hours * (pricePerHour != null ? pricePerHour : 0.0);
    }

    private static String requireNormalizedPlate(String plate) {
        String normalized = normalizePlate(plate);
        if (normalized == null || !PlateNormalizer.isValid(normalized)) {
            throw new BadRequestException("Invalid license plate");
        }
        return normalized;
    }

    private static String normalizePlate(String plate) {
        if (plate == null) {
            return null;
        }
        // Delegate to the project-wide normalizer so reservation-side and
        // guard-side keys agree (Arabic letters mapped, not stripped).
        String normalized = PlateNormalizer.normalize(plate);
        return (normalized == null || normalized.isBlank()) ? null : normalized;
    }
}
