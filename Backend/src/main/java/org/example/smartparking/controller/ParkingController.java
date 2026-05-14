package org.example.smartparking.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.smartparking.dto.request.ParkingRequest;
import org.example.smartparking.dto.request.ParkingRatingRequest;
import org.example.smartparking.dto.response.ApiResponse;
import org.example.smartparking.dto.response.ParkingResponse;
import org.example.smartparking.dto.response.ParkingReviewResponse;
import org.example.smartparking.service.ParkingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parkings")
@RequiredArgsConstructor
public class ParkingController {

    private final ParkingService parkingService;

    @PostMapping
    public ResponseEntity<ApiResponse<ParkingResponse>> createParking(
            @Valid @RequestBody ParkingRequest request) {
        ParkingResponse response = parkingService.createParking(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Parking created successfully", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ParkingResponse>> updateParking(
            @PathVariable Long id,
            @Valid @RequestBody ParkingRequest request) {
        ParkingResponse response = parkingService.updateParking(id, request);
        return ResponseEntity.ok(ApiResponse.success("Parking updated successfully", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteParking(@PathVariable Long id) {
        parkingService.deleteParking(id);
        return ResponseEntity.ok(ApiResponse.success("Parking deleted successfully", null));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ParkingResponse>> getParkingById(@PathVariable Long id) {
        ParkingResponse response = parkingService.getParkingById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/reviews")
    public ResponseEntity<ApiResponse<List<ParkingReviewResponse>>> getParkingReviews(
            @PathVariable Long id,
            @RequestParam(defaultValue = "6") int limit) {
        List<ParkingReviewResponse> response = parkingService.getParkingReviews(id, Math.max(1, Math.min(limit, 20)));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/rating")
    public ResponseEntity<ApiResponse<ParkingResponse>> rateParking(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody ParkingRatingRequest request) {
        ParkingResponse response = parkingService.rateParking(authentication.getName(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Rating saved", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ParkingResponse>>> getAllParkings() {
        List<ParkingResponse> response = parkingService.getAllParkings();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<ParkingResponse>>> getActiveParkings() {
        List<ParkingResponse> response = parkingService.getActiveParkings();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<ParkingResponse>>> searchParkings(
            @RequestParam String name) {
        List<ParkingResponse> response = parkingService.searchParkings(name);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}

