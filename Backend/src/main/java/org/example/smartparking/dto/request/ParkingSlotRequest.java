package org.example.smartparking.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.smartparking.entity.SlotStatus;
import org.example.smartparking.entity.SlotType;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ParkingSlotRequest {

    @NotBlank(message = "Slot number is required")
    @Size(max = 20, message = "Slot number must not exceed 20 characters")
    private String slotNumber;

    private SlotType slotType;

    private SlotStatus status;

    @Size(max = 10, message = "Floor must not exceed 10 characters")
    private String floor;

    @NotNull(message = "Parking ID is required")
    private Long parkingId;
}

