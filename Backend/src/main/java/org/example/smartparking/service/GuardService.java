package org.example.smartparking.service;

import org.example.smartparking.dto.response.GuardScanResultResponse;
import org.example.smartparking.dto.response.GuardPlateEntryResponse;
import org.example.smartparking.dto.response.GuardPlateExitResponse;
import org.example.smartparking.dto.response.GuardPlateLookupResponse;
import org.example.smartparking.dto.response.GuardPlateScanFlowResponse;
import org.example.smartparking.dto.response.PlateOcrResponse;
import org.example.smartparking.dto.response.ReservationResponse;
import org.example.smartparking.dto.response.WalkInSessionResponse;

import java.util.List;

public interface GuardService {

    GuardScanResultResponse validateEntry(String qrPayload, String guardEmail);

    GuardScanResultResponse validateExit(String qrPayload, String guardEmail);

    GuardScanResultResponse validateEntryByReservationId(Long reservationId, String guardEmail);

    GuardScanResultResponse validateExitByReservationId(Long reservationId, String guardEmail);

    List<ReservationResponse> listActiveBookingsForParking(Long parkingId, String guardEmail);

    void manualOccupySlot(Long slotId, String guardEmail);

    void manualFreeSlot(Long slotId, String guardEmail);

    PlateOcrResponse readPlate(byte[] imageBytes, String filename);

    GuardPlateScanFlowResponse scanPlate(Long parkingId, byte[] imageBytes, String filename, String guardEmail);

    GuardPlateLookupResponse lookupPlate(Long parkingId, String plate, String guardEmail);

    GuardPlateEntryResponse plateEntry(Long parkingId, String plate, Long parkingSlotId, String notes, String guardEmail);

    GuardPlateExitResponse plateExit(Long parkingId, String plate, Boolean paidOnExit, String guardEmail);

    List<WalkInSessionResponse> listActiveWalkIns(Long parkingId, String guardEmail);

    void markWalkInPaid(Long sessionId, String guardEmail);
}
