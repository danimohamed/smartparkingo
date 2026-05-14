package org.example.smartparking.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.smartparking.dto.request.ChangeRoleRequest;
import org.example.smartparking.dto.response.*;
import org.example.smartparking.service.AdminService;
import org.example.smartparking.service.PaymentService;
import org.example.smartparking.service.ReservationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final ReservationService reservationService;
    private final PaymentService paymentService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboard() {
        DashboardResponse response = adminService.getDashboard();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        List<UserResponse> response = adminService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully", null));
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<ApiResponse<UserResponse>> changeUserRole(
            @PathVariable Long id,
            @Valid @RequestBody ChangeRoleRequest request) {
        UserResponse response = adminService.changeUserRole(id, request);
        return ResponseEntity.ok(ApiResponse.success("Role updated successfully", response));
    }

    @GetMapping("/reservations")
    public ResponseEntity<ApiResponse<List<ReservationResponse>>> getAllReservations() {
        List<ReservationResponse> response = reservationService.getAllReservations();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/reservations/{id}/cancel")
    public ResponseEntity<ApiResponse<ReservationResponse>> adminCancelReservation(@PathVariable Long id) {
        ReservationResponse response = reservationService.adminCancelReservation(id);
        return ResponseEntity.ok(ApiResponse.success("Reservation cancelled successfully", response));
    }

    @GetMapping("/payments")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getAllPayments() {
        List<PaymentResponse> response = paymentService.getAllPayments();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/wallets")
    public ResponseEntity<ApiResponse<List<AdminWalletResponse>>> getAllWallets() {
        List<AdminWalletResponse> response = adminService.getAllWallets();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/wallets/{userId}/transactions")
    public ResponseEntity<ApiResponse<List<WalletTransactionResponse>>> getWalletTransactions(
            @PathVariable Long userId) {
        List<WalletTransactionResponse> response = adminService.getWalletTransactionsByUser(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ─── Withdrawal Management ──────────────────────────────

    @GetMapping("/withdrawals")
    public ResponseEntity<ApiResponse<List<WithdrawalResponse>>> getAllWithdrawals() {
        List<WithdrawalResponse> response = adminService.getAllWithdrawals();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/withdrawals/pending")
    public ResponseEntity<ApiResponse<List<WithdrawalResponse>>> getPendingWithdrawals() {
        List<WithdrawalResponse> response = adminService.getPendingWithdrawals();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/withdrawals/{id}/approve")
    public ResponseEntity<ApiResponse<WithdrawalResponse>> approveWithdrawal(@PathVariable Long id) {
        WithdrawalResponse response = adminService.approveWithdrawal(id);
        return ResponseEntity.ok(ApiResponse.success("Withdrawal approved successfully", response));
    }

    @PutMapping("/withdrawals/{id}/reject")
    public ResponseEntity<ApiResponse<WithdrawalResponse>> rejectWithdrawal(@PathVariable Long id) {
        WithdrawalResponse response = adminService.rejectWithdrawal(id);
        return ResponseEntity.ok(ApiResponse.success("Withdrawal rejected successfully", response));
    }
}

