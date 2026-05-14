package org.example.smartparking.service;

import org.example.smartparking.dto.request.ReservationRequest;
import org.example.smartparking.dto.response.QrTokenResponse;
import org.example.smartparking.dto.response.ReservationResponse;

import java.util.List;

public interface ReservationService {
    ReservationResponse createReservation(ReservationRequest request, String userEmail);

    QrTokenResponse getQrToken(Long reservationId, String userEmail);
    ReservationResponse cancelReservation(Long id, String userEmail);
    ReservationResponse adminCancelReservation(Long id);
    ReservationResponse getReservationById(Long id);
    List<ReservationResponse> getUserReservations(String userEmail);
    List<ReservationResponse> getAllReservations();
}

