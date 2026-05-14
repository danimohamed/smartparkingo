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
public class OwnerParkingAnalyticsLiveResponse {
    private Long parkingId;
    private String parkingName;
    private String sampleVideoFilename;
    /** Physical lot capacity from parkings.total_slots (for context). */
    private Integer parkingLotCapacity;
    /** Normalized slot rects from analytics config (always sent when configured). */
    private String slotRegionsJson;
    private Integer carsInFrame;
    private Integer enteredCount;
    private Integer exitedCount;
    private LocalDateTime updatedAt;
}
