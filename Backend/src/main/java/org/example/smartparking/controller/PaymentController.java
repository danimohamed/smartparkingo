package org.example.smartparking.controller;

import lombok.RequiredArgsConstructor;
import org.example.smartparking.dto.response.ApiResponse;
import org.example.smartparking.dto.response.PaymentResponse;
import org.example.smartparking.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping("/reservation/{reservationId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentByReservationId(
            @PathVariable Long reservationId) {
        PaymentResponse response = paymentService.getPaymentByReservationId(reservationId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/my-payments")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getMyPayments(
            Authentication authentication) {
        List<PaymentResponse> response = paymentService.getUserPayments(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}

