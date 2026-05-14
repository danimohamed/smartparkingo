package org.example.smartparking.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.smartparking.dto.request.ParkingSlotRequest;
import org.example.smartparking.dto.response.ParkingSlotResponse;
import org.example.smartparking.entity.Parking;
import org.example.smartparking.entity.ParkingSlot;
import org.example.smartparking.entity.SlotStatus;
import org.example.smartparking.entity.SlotType;
import org.example.smartparking.exception.ResourceNotFoundException;
import org.example.smartparking.repository.ParkingRepository;
import org.example.smartparking.repository.ParkingSlotRepository;
import org.example.smartparking.service.ParkingSlotService;
import org.example.smartparking.config.CacheConfig;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ParkingSlotServiceImpl implements ParkingSlotService {

    private final ParkingSlotRepository parkingSlotRepository;
    private final ParkingRepository parkingRepository;

    @Override
    @Transactional
    public ParkingSlotResponse createParkingSlot(ParkingSlotRequest request) {
        Parking parking = parkingRepository.findById(request.getParkingId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parking not found with id: " + request.getParkingId()));

        ParkingSlot slot = ParkingSlot.builder()
                .slotNumber(request.getSlotNumber())
                .slotType(request.getSlotType() != null ? request.getSlotType() : SlotType.STANDARD)
                .floor(request.getFloor())
                .status(SlotStatus.AVAILABLE)
                .parking(parking)
                .build();

        slot = parkingSlotRepository.save(slot);
        return mapToResponse(slot);
    }

    @Override
    @Transactional
    public ParkingSlotResponse updateParkingSlot(Long id, ParkingSlotRequest request) {
        ParkingSlot slot = parkingSlotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Parking slot not found with id: " + id));

        slot.setSlotNumber(request.getSlotNumber());
        slot.setSlotType(request.getSlotType() != null ? request.getSlotType() : slot.getSlotType());
        slot.setFloor(request.getFloor());
        if (request.getStatus() != null) {
            slot.setStatus(request.getStatus());
        }

        slot = parkingSlotRepository.save(slot);
        return mapToResponse(slot);
    }

    @Override
    @Transactional
    public void deleteParkingSlot(Long id) {
        ParkingSlot slot = parkingSlotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Parking slot not found with id: " + id));
        parkingSlotRepository.delete(slot);
    }

    @Override
    @Transactional(readOnly = true)
    public ParkingSlotResponse getParkingSlotById(Long id) {
        ParkingSlot slot = parkingSlotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Parking slot not found with id: " + id));
        return mapToResponse(slot);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.SLOTS_BY_PARKING, key = "#parkingId")
    public List<ParkingSlotResponse> getSlotsByParkingId(Long parkingId) {
        return parkingSlotRepository.findByParkingId(parkingId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.SLOTS_AVAILABLE_BY_PARKING, key = "#parkingId")
    public List<ParkingSlotResponse> getAvailableSlots(Long parkingId) {
        return parkingSlotRepository.findByParkingIdAndStatus(parkingId, SlotStatus.AVAILABLE).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private ParkingSlotResponse mapToResponse(ParkingSlot slot) {
        return ParkingSlotResponse.builder()
                .id(slot.getId())
                .slotNumber(slot.getSlotNumber())
                .status(slot.getStatus().name())
                .slotType(slot.getSlotType().name())
                .floor(slot.getFloor())
                .parkingId(slot.getParking().getId())
                .parkingName(slot.getParking().getName())
                .createdAt(slot.getCreatedAt())
                .build();
    }
}

