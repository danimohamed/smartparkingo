package org.example.smartparking.service;

import org.example.smartparking.dto.request.GuardAssignRequest;
import org.example.smartparking.dto.request.ParkingRequest;
import org.example.smartparking.dto.request.ParkingSlotRequest;
import org.example.smartparking.dto.request.WithdrawRequest;
import org.example.smartparking.dto.response.*;

import java.util.List;

public interface OwnerService {

    OwnerDashboardResponse getDashboard(Long ownerId);
    OwnerDashboardResponse getDashboardForAdmin();

    EarningsResponse getEarnings(Long ownerId);
    EarningsResponse getEarningsForAdmin();

    // Parking management
    ParkingResponse createParking(Long ownerId, ParkingRequest request);
    ParkingResponse updateParking(Long ownerId, Long parkingId, ParkingRequest request);
    void deleteParking(Long ownerId, Long parkingId);
    List<ParkingResponse> getMyParkings(Long ownerId);
    ParkingResponse getMyParkingById(Long ownerId, Long parkingId);

    ParkingResponse assignGuards(Long ownerId, Long parkingId, GuardAssignRequest request);

    List<ParkingGuardSummary> listGuardCandidates();

    // Slot management
    ParkingSlotResponse addSlot(Long ownerId, Long parkingId, ParkingSlotRequest request);
    ParkingSlotResponse updateSlot(Long ownerId, Long slotId, ParkingSlotRequest request);
    void deleteSlot(Long ownerId, Long slotId);
    List<ParkingSlotResponse> getSlotsByParking(Long ownerId, Long parkingId);

    // Reservations
    List<ReservationResponse> getMyReservations(Long ownerId);
    List<ReservationResponse> getReservationsForAdmin();

    // Withdrawals
    WithdrawalResponse requestWithdrawal(Long ownerId, WithdrawRequest request);
    List<WithdrawalResponse> getMyWithdrawals(Long ownerId);
}
