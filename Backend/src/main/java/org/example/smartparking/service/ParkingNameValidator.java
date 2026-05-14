package org.example.smartparking.service;

import lombok.RequiredArgsConstructor;
import org.example.smartparking.exception.BadRequestException;
import org.example.smartparking.repository.ParkingRepository;
import org.springframework.stereotype.Component;

/**
 * Ensures parking names are unique (case-insensitive), matching DB unique constraint.
 */
@Component
@RequiredArgsConstructor
public class ParkingNameValidator {

    private final ParkingRepository parkingRepository;

    /**
     * @param excludeParkingId pass null on create; on update, the id of the row being edited
     */
    public void assertUniqueName(String name, Long excludeParkingId) {
        if (name == null || name.isBlank()) {
            throw new BadRequestException("Parking name is required");
        }
        String trimmed = name.trim();
        if (excludeParkingId == null) {
            if (parkingRepository.existsByNameIgnoreCase(trimmed)) {
                throw new BadRequestException("A parking with this name already exists");
            }
        } else {
            if (parkingRepository.existsByNameIgnoreCaseAndIdNot(trimmed, excludeParkingId)) {
                throw new BadRequestException("A parking with this name already exists");
            }
        }
    }
}
