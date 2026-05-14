package org.example.smartparking.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.smartparking.dto.request.GuardAssignRequest;
import org.example.smartparking.dto.request.ParkingRequest;
import org.example.smartparking.dto.request.ParkingSlotRequest;
import org.example.smartparking.dto.request.WithdrawRequest;
import org.example.smartparking.dto.response.ApiResponse;
import org.example.smartparking.dto.response.EarningsResponse;
import org.example.smartparking.dto.response.OwnerDashboardResponse;
import org.example.smartparking.dto.response.ParkingGuardSummary;
import org.example.smartparking.dto.response.ParkingResponse;
import org.example.smartparking.dto.response.ParkingSlotResponse;
import org.example.smartparking.dto.response.ReservationResponse;
import org.example.smartparking.dto.response.WithdrawalResponse;
import org.example.smartparking.entity.User;
import org.example.smartparking.exception.ResourceNotFoundException;
import org.example.smartparking.repository.UserRepository;
import org.example.smartparking.service.OwnerService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/owner")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('PARKING_OWNER','ADMIN')")
public class OwnerController {

    private final OwnerService ownerService;
    private final UserRepository userRepository;

    // ─── Dashboard ──────────────────────────────────────────

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<OwnerDashboardResponse>> getDashboard(Authentication auth) {
        OwnerDashboardResponse response =
                isAdmin(auth) ? ownerService.getDashboardForAdmin() : ownerService.getDashboard(resolveOwnerId(auth));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/earnings")
    public ResponseEntity<ApiResponse<EarningsResponse>> getEarnings(Authentication auth) {
        EarningsResponse response =
                isAdmin(auth) ? ownerService.getEarningsForAdmin() : ownerService.getEarnings(resolveOwnerId(auth));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ─── Parking Management ─────────────────────────────────

    @GetMapping("/parkings")
    @PreAuthorize("hasRole('PARKING_OWNER')")
    public ResponseEntity<ApiResponse<List<ParkingResponse>>> getMyParkings(Authentication auth) {
        Long ownerId = resolveOwnerId(auth);
        List<ParkingResponse> response = ownerService.getMyParkings(ownerId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/parkings/{parkingId}")
    @PreAuthorize("hasRole('PARKING_OWNER')")
    public ResponseEntity<ApiResponse<ParkingResponse>> getMyParkingById(
            @PathVariable Long parkingId, Authentication auth) {
        Long ownerId = resolveOwnerId(auth);
        ParkingResponse response = ownerService.getMyParkingById(ownerId, parkingId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/guard-candidates")
    @PreAuthorize("hasRole('PARKING_OWNER')")
    public ResponseEntity<ApiResponse<List<ParkingGuardSummary>>> listGuardCandidates(Authentication auth) {
        resolveOwnerId(auth);
        return ResponseEntity.ok(ApiResponse.success(ownerService.listGuardCandidates()));
    }

    @PutMapping("/parkings/{parkingId}/guards")
    @PreAuthorize("hasRole('PARKING_OWNER')")
    public ResponseEntity<ApiResponse<ParkingResponse>> assignGuards(
            @PathVariable Long parkingId,
            @Valid @RequestBody GuardAssignRequest request,
            Authentication auth) {
        Long ownerId = resolveOwnerId(auth);
        ParkingResponse response = ownerService.assignGuards(ownerId, parkingId, request);
        return ResponseEntity.ok(ApiResponse.success("Guards updated", response));
    }

    @PostMapping("/parkings")
    @PreAuthorize("hasRole('PARKING_OWNER')")
    public ResponseEntity<ApiResponse<ParkingResponse>> createParking(
            @Valid @RequestBody ParkingRequest request, Authentication auth) {
        Long ownerId = resolveOwnerId(auth);
        ParkingResponse response = ownerService.createParking(ownerId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Parking created successfully", response));
    }

    @PutMapping("/parkings/{parkingId}")
    @PreAuthorize("hasRole('PARKING_OWNER')")
    public ResponseEntity<ApiResponse<ParkingResponse>> updateParking(
            @PathVariable Long parkingId,
            @Valid @RequestBody ParkingRequest request,
            Authentication auth) {
        Long ownerId = resolveOwnerId(auth);
        ParkingResponse response = ownerService.updateParking(ownerId, parkingId, request);
        return ResponseEntity.ok(ApiResponse.success("Parking updated successfully", response));
    }

    @DeleteMapping("/parkings/{parkingId}")
    @PreAuthorize("hasRole('PARKING_OWNER')")
    public ResponseEntity<ApiResponse<Void>> deleteParking(
            @PathVariable Long parkingId, Authentication auth) {
        Long ownerId = resolveOwnerId(auth);
        ownerService.deleteParking(ownerId, parkingId);
        return ResponseEntity.ok(ApiResponse.success("Parking deleted successfully", null));
    }

    // ─── Slot Management ────────────────────────────────────

    @GetMapping("/parkings/{parkingId}/slots")
    @PreAuthorize("hasRole('PARKING_OWNER')")
    public ResponseEntity<ApiResponse<List<ParkingSlotResponse>>> getSlots(
            @PathVariable Long parkingId, Authentication auth) {
        Long ownerId = resolveOwnerId(auth);
        List<ParkingSlotResponse> response = ownerService.getSlotsByParking(ownerId, parkingId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/parkings/{parkingId}/slots")
    @PreAuthorize("hasRole('PARKING_OWNER')")
    public ResponseEntity<ApiResponse<ParkingSlotResponse>> addSlot(
            @PathVariable Long parkingId,
            @Valid @RequestBody ParkingSlotRequest request,
            Authentication auth) {
        Long ownerId = resolveOwnerId(auth);
        ParkingSlotResponse response = ownerService.addSlot(ownerId, parkingId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Slot added successfully", response));
    }

    @PutMapping("/slots/{slotId}")
    @PreAuthorize("hasRole('PARKING_OWNER')")
    public ResponseEntity<ApiResponse<ParkingSlotResponse>> updateSlot(
            @PathVariable Long slotId,
            @Valid @RequestBody ParkingSlotRequest request,
            Authentication auth) {
        Long ownerId = resolveOwnerId(auth);
        ParkingSlotResponse response = ownerService.updateSlot(ownerId, slotId, request);
        return ResponseEntity.ok(ApiResponse.success("Slot updated successfully", response));
    }

    @DeleteMapping("/slots/{slotId}")
    @PreAuthorize("hasRole('PARKING_OWNER')")
    public ResponseEntity<ApiResponse<Void>> deleteSlot(
            @PathVariable Long slotId, Authentication auth) {
        Long ownerId = resolveOwnerId(auth);
        ownerService.deleteSlot(ownerId, slotId);
        return ResponseEntity.ok(ApiResponse.success("Slot deleted successfully", null));
    }

    // ─── Reservations ───────────────────────────────────────

    @GetMapping("/reservations")
    public ResponseEntity<ApiResponse<List<ReservationResponse>>> getMyReservations(Authentication auth) {
        List<ReservationResponse> response =
                isAdmin(auth) ? ownerService.getReservationsForAdmin() : ownerService.getMyReservations(resolveOwnerId(auth));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ─── Withdrawals ────────────────────────────────────────

    @PostMapping("/withdrawals")
    @PreAuthorize("hasRole('PARKING_OWNER')")
    public ResponseEntity<ApiResponse<WithdrawalResponse>> requestWithdrawal(
            @Valid @RequestBody WithdrawRequest request, Authentication auth) {
        Long ownerId = resolveOwnerId(auth);
        WithdrawalResponse response = ownerService.requestWithdrawal(ownerId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Withdrawal requested successfully", response));
    }

    @GetMapping("/withdrawals")
    @PreAuthorize("hasRole('PARKING_OWNER')")
    public ResponseEntity<ApiResponse<List<WithdrawalResponse>>> getMyWithdrawals(Authentication auth) {
        Long ownerId = resolveOwnerId(auth);
        List<WithdrawalResponse> response = ownerService.getMyWithdrawals(ownerId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ─── Helper ─────────────────────────────────────────────

    private Long resolveOwnerId(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return user.getId();
    }

    private boolean isAdmin(Authentication auth) {
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }
}
