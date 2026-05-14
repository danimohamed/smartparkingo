package org.example.smartparking.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.smartparking.dto.request.ParkingSlotRequest;
import org.example.smartparking.dto.response.ApiResponse;
import org.example.smartparking.dto.response.ParkingSlotResponse;
import org.example.smartparking.service.ParkingSlotService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parking-slots")
@RequiredArgsConstructor
public class ParkingSlotController {

    private final ParkingSlotService parkingSlotService;

    @PostMapping
    public ResponseEntity<ApiResponse<ParkingSlotResponse>> createParkingSlot(
            @Valid @RequestBody ParkingSlotRequest request) {
        ParkingSlotResponse response = parkingSlotService.createParkingSlot(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Parking slot created successfully", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ParkingSlotResponse>> updateParkingSlot(
            @PathVariable Long id,
            @Valid @RequestBody ParkingSlotRequest request) {
        ParkingSlotResponse response = parkingSlotService.updateParkingSlot(id, request);
        return ResponseEntity.ok(ApiResponse.success("Parking slot updated successfully", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteParkingSlot(@PathVariable Long id) {
        parkingSlotService.deleteParkingSlot(id);
        return ResponseEntity.ok(ApiResponse.success("Parking slot deleted successfully", null));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ParkingSlotResponse>> getParkingSlotById(@PathVariable Long id) {
        ParkingSlotResponse response = parkingSlotService.getParkingSlotById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/parking/{parkingId}")
    public ResponseEntity<ApiResponse<List<ParkingSlotResponse>>> getSlotsByParkingId(
            @PathVariable Long parkingId) {
        List<ParkingSlotResponse> response = parkingSlotService.getSlotsByParkingId(parkingId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/available/{parkingId}")
    public ResponseEntity<ApiResponse<List<ParkingSlotResponse>>> getAvailableSlots(
            @PathVariable Long parkingId) {
        List<ParkingSlotResponse> response = parkingSlotService.getAvailableSlots(parkingId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}

