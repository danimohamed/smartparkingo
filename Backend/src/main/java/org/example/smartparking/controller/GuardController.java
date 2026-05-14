package org.example.smartparking.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.smartparking.dto.request.GuardManualReservationRequest;
import org.example.smartparking.dto.request.GuardPlateEntryRequest;
import org.example.smartparking.dto.request.GuardPlateExitRequest;
import org.example.smartparking.dto.request.GuardScanRequest;
import org.example.smartparking.dto.response.ApiResponse;
import org.example.smartparking.dto.response.GuardPlateEntryResponse;
import org.example.smartparking.dto.response.GuardPlateExitResponse;
import org.example.smartparking.dto.response.GuardPlateLookupResponse;
import org.example.smartparking.dto.response.GuardPlateScanFlowResponse;
import org.example.smartparking.dto.response.GuardScanResultResponse;
import org.example.smartparking.dto.response.PlateOcrResponse;
import org.example.smartparking.dto.response.ReservationResponse;
import org.example.smartparking.dto.response.WalkInSessionResponse;
import org.example.smartparking.service.GuardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/guard")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('GUARD','ADMIN')")
public class GuardController {

    private final GuardService guardService;

    @PostMapping("/validate-entry")
    public ResponseEntity<ApiResponse<GuardScanResultResponse>> validateEntry(
            @Valid @RequestBody GuardScanRequest request,
            Authentication authentication) {
        GuardScanResultResponse result = guardService.validateEntry(request.getQrPayload(), authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(result.isValid() ? "OK" : "Rejected", result));
    }

    @PostMapping("/validate-exit")
    public ResponseEntity<ApiResponse<GuardScanResultResponse>> validateExit(
            @Valid @RequestBody GuardScanRequest request,
            Authentication authentication) {
        GuardScanResultResponse result = guardService.validateExit(request.getQrPayload(), authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(result.isValid() ? "OK" : "Rejected", result));
    }

    @PostMapping("/validate-entry-manual")
    public ResponseEntity<ApiResponse<GuardScanResultResponse>> validateEntryManual(
            @Valid @RequestBody GuardManualReservationRequest request,
            Authentication authentication) {
        GuardScanResultResponse result = guardService.validateEntryByReservationId(
                request.getReservationId(), authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(result.isValid() ? "OK" : "Rejected", result));
    }

    @PostMapping("/validate-exit-manual")
    public ResponseEntity<ApiResponse<GuardScanResultResponse>> validateExitManual(
            @Valid @RequestBody GuardManualReservationRequest request,
            Authentication authentication) {
        GuardScanResultResponse result = guardService.validateExitByReservationId(
                request.getReservationId(), authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(result.isValid() ? "OK" : "Rejected", result));
    }

    @GetMapping("/parking/{parkingId}/active-bookings")
    public ResponseEntity<ApiResponse<List<ReservationResponse>>> activeBookings(
            @PathVariable Long parkingId,
            Authentication authentication) {
        List<ReservationResponse> list = guardService.listActiveBookingsForParking(parkingId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/slots/{slotId}/manual-occupy")
    public ResponseEntity<ApiResponse<Void>> manualOccupy(
            @PathVariable Long slotId,
            Authentication authentication) {
        guardService.manualOccupySlot(slotId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Slot marked occupied", null));
    }

    @PostMapping("/slots/{slotId}/manual-free")
    public ResponseEntity<ApiResponse<Void>> manualFree(
            @PathVariable Long slotId,
            Authentication authentication) {
        guardService.manualFreeSlot(slotId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Slot freed", null));
    }

    @PostMapping("/plate/ocr")
    public ResponseEntity<ApiResponse<PlateOcrResponse>> plateOcr(
            @RequestParam("file") MultipartFile file) throws IOException {
        PlateOcrResponse result = guardService.readPlate(file.getBytes(), file.getOriginalFilename());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/plate/scan")
    public ResponseEntity<ApiResponse<GuardPlateScanFlowResponse>> scanPlate(
            @RequestParam("parkingId") Long parkingId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) throws IOException {
        GuardPlateScanFlowResponse result = guardService.scanPlate(
                parkingId, file.getBytes(), file.getOriginalFilename(), authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/plate/lookup")
    public ResponseEntity<ApiResponse<GuardPlateLookupResponse>> lookupPlate(
            @RequestParam Long parkingId,
            @RequestParam String plate,
            Authentication authentication) {
        GuardPlateLookupResponse result = guardService.lookupPlate(parkingId, plate, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/plate/entry")
    public ResponseEntity<ApiResponse<GuardPlateEntryResponse>> plateEntry(
            @Valid @RequestBody GuardPlateEntryRequest request,
            Authentication authentication) {
        GuardPlateEntryResponse result = guardService.plateEntry(
                request.getParkingId(),
                request.getPlate(),
                request.getParkingSlotId(),
                request.getNotes(),
                authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(result.isSuccess() ? "OK" : "Rejected", result));
    }

    @PostMapping("/plate/exit")
    public ResponseEntity<ApiResponse<GuardPlateExitResponse>> plateExit(
            @Valid @RequestBody GuardPlateExitRequest request,
            Authentication authentication) {
        GuardPlateExitResponse result = guardService.plateExit(
                request.getParkingId(),
                request.getPlate(),
                request.getPaidOnExit(),
                authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(result.isSuccess() ? "OK" : "Rejected", result));
    }

    @GetMapping("/parking/{parkingId}/active-walk-ins")
    public ResponseEntity<ApiResponse<List<WalkInSessionResponse>>> activeWalkIns(
            @PathVariable Long parkingId,
            Authentication authentication) {
        List<WalkInSessionResponse> list = guardService.listActiveWalkIns(parkingId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/walk-in/{sessionId}/mark-paid")
    public ResponseEntity<ApiResponse<Void>> markWalkInPaid(
            @PathVariable Long sessionId,
            Authentication authentication) {
        guardService.markWalkInPaid(sessionId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Walk-in marked paid", null));
    }
}
