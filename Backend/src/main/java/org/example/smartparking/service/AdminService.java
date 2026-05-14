package org.example.smartparking.service;

import org.example.smartparking.dto.request.ChangeRoleRequest;
import org.example.smartparking.dto.response.AdminWalletResponse;
import org.example.smartparking.dto.response.DashboardResponse;
import org.example.smartparking.dto.response.UserResponse;
import org.example.smartparking.dto.response.WalletTransactionResponse;
import org.example.smartparking.dto.response.WithdrawalResponse;

import java.util.List;

public interface AdminService {
    DashboardResponse getDashboard();
    List<UserResponse> getAllUsers();
    void deleteUser(Long id);
    UserResponse changeUserRole(Long id, ChangeRoleRequest request);
    List<AdminWalletResponse> getAllWallets();
    List<WalletTransactionResponse> getWalletTransactionsByUser(Long userId);

    // Withdrawal management
    List<WithdrawalResponse> getAllWithdrawals();
    List<WithdrawalResponse> getPendingWithdrawals();
    WithdrawalResponse approveWithdrawal(Long withdrawalId);
    WithdrawalResponse rejectWithdrawal(Long withdrawalId);
}

