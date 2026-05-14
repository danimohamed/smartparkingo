package org.example.smartparking.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParkingSlotResponse {
    private Long id;
    private String slotNumber;
    private String status;
    private String slotType;
    private String floor;
    private Long parkingId;
    private String parkingName;
    private LocalDateTime createdAt;
}

