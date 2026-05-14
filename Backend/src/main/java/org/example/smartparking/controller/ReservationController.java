package org.example.smartparking.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.smartparking.dto.request.ReservationRequest;
import org.example.smartparking.dto.response.ApiResponse;
import org.example.smartparking.dto.response.QrTokenResponse;
import org.example.smartparking.dto.response.ReservationResponse;
import org.example.smartparking.service.ReservationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReservationResponse>> createReservation(
            @Valid @RequestBody ReservationRequest request,
            Authentication authentication) {
        ReservationResponse response = reservationService.createReservation(
                request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Reservation created successfully", response));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<ReservationResponse>> cancelReservation(
            @PathVariable Long id,
            Authentication authentication) {
        ReservationResponse response = reservationService.cancelReservation(
                id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Reservation cancelled successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReservationResponse>> getReservationById(@PathVariable Long id) {
        ReservationResponse response = reservationService.getReservationById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/qr")
    public ResponseEntity<ApiResponse<QrTokenResponse>> getQrToken(
            @PathVariable Long id,
            Authentication authentication) {
        QrTokenResponse response = reservationService.getQrToken(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/my-reservations")
    public ResponseEntity<ApiResponse<List<ReservationResponse>>> getMyReservations(
            Authentication authentication) {
        List<ReservationResponse> response = reservationService.getUserReservations(
                authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}

