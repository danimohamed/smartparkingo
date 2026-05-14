package org.example.smartparking.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * outcome: RESERVATION_CHECKED_IN | WALK_IN_STARTED | REJECTED
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuardPlateEntryResponse {
    private boolean success;
    private String outcome;
    private String message;
    private ReservationResponse reservation;
    private WalkInSessionResponse walkIn;
}
