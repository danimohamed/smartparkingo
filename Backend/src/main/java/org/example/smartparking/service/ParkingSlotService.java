package org.example.smartparking.service;

import org.example.smartparking.dto.request.ParkingSlotRequest;
import org.example.smartparking.dto.response.ParkingSlotResponse;

import java.util.List;

public interface ParkingSlotService {
    ParkingSlotResponse createParkingSlot(ParkingSlotRequest request);
    ParkingSlotResponse updateParkingSlot(Long id, ParkingSlotRequest request);
    void deleteParkingSlot(Long id);
    ParkingSlotResponse getParkingSlotById(Long id);
    List<ParkingSlotResponse> getSlotsByParkingId(Long parkingId);
    List<ParkingSlotResponse> getAvailableSlots(Long parkingId);
}

