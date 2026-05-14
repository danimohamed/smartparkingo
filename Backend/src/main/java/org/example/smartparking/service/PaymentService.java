package org.example.smartparking.service;

import org.example.smartparking.dto.response.PaymentResponse;

import java.util.List;

public interface PaymentService {
    PaymentResponse getPaymentByReservationId(Long reservationId);
    List<PaymentResponse> getUserPayments(String userEmail);
    List<PaymentResponse> getAllPayments();
}

