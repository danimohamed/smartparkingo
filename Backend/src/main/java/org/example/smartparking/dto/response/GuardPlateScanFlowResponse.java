package org.example.smartparking.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuardPlateScanFlowResponse {
    /** OCR-read plate string (may be null when OCR disabled/fails). */
    private String plate;
    /** Confidence score 0.0–1.0 reported by the ALPR engine for this read. */
    private Double confidence;
    /** True when we found a matching active booking today in this parking. */
    private boolean isAppUser;
    /** Message to show on UI. */
    private String message;
    /** Reservation details when matched. */
    private ReservationResponse reservation;

    /** Updated counters after this scan. */
    private long appUsersToday;
    private long nonAppUsersToday;
}

