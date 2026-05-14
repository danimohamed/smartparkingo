package org.example.smartparking.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * outcome: RESERVATION_EXIT | WALK_IN_EXIT | REJECTED
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuardPlateExitResponse {
    private boolean success;
    private String outcome;
    private String message;
    private ReservationResponse reservation;
    private WalkInSessionResponse walkIn;
}
