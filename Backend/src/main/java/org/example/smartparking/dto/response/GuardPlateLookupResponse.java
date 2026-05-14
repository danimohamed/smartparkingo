package org.example.smartparking.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuardPlateLookupResponse {
    /** True when a reservation exists for this plate in today's active bookings. */
    private boolean found;
    /** Normalized plate (server normalization, alphanumeric uppercase). */
    private String plateNormalized;
    /** Human-readable message. */
    private String message;
    /** Reservation details when found. */
    private ReservationResponse reservation;
}

