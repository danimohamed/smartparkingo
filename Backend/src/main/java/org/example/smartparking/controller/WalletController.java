package org.example.smartparking.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.smartparking.dto.request.TopUpRequest;
import org.example.smartparking.dto.request.WalletPaymentRequest;
import org.example.smartparking.dto.response.WalletResponse;
import org.example.smartparking.dto.response.WalletTransactionResponse;
import org.example.smartparking.service.WalletService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping("/balance")
    public ResponseEntity<Map<String, Object>> getBalance(Authentication auth) {
        WalletResponse wallet = walletService.getWallet(auth.getName());
        return ResponseEntity.ok(Map.of("success", true, "data", wallet));
    }

    @PostMapping("/top-up")
    public ResponseEntity<Map<String, Object>> topUp(
            Authentication auth,
            @Valid @RequestBody TopUpRequest request) {
        WalletResponse wallet = walletService.topUp(auth.getName(), request);
        return ResponseEntity.ok(Map.of("success", true, "data", wallet, "message", "Top-up successful!"));
    }

    @PostMapping("/pay")
    public ResponseEntity<Map<String, Object>> payForReservation(
            Authentication auth,
            @Valid @RequestBody WalletPaymentRequest request) {
        WalletResponse wallet = walletService.payForReservation(auth.getName(), request);
        return ResponseEntity.ok(Map.of("success", true, "data", wallet, "message", "Payment successful!"));
    }

    @GetMapping("/transactions")
    public ResponseEntity<Map<String, Object>> getTransactions(Authentication auth) {
        List<WalletTransactionResponse> transactions = walletService.getTransactionHistory(auth.getName());
        return ResponseEntity.ok(Map.of("success", true, "data", transactions));
    }
}

