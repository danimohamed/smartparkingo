package org.example.smartparking.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalkInSessionResponse {
    private Long id;
    private Long parkingId;
    private String parkingName;
    private Long parkingSlotId;
    private String slotNumber;
    private String plateNormalized;
    private String plateRaw;
    private LocalDateTime entryTime;
    private LocalDateTime exitTime;
    private String status;
    private Double pricePerHourSnapshot;
    private Double amountDue;
}
