package org.example.smartparking.service;

import org.example.smartparking.dto.request.TopUpRequest;
import org.example.smartparking.dto.request.WalletPaymentRequest;
import org.example.smartparking.dto.response.WalletResponse;
import org.example.smartparking.dto.response.WalletTransactionResponse;

import java.util.List;

public interface WalletService {
    WalletResponse getWallet(String email);
    WalletResponse topUp(String email, TopUpRequest request);
    WalletResponse payForReservation(String email, WalletPaymentRequest request);
    List<WalletTransactionResponse> getTransactionHistory(String email);
}

