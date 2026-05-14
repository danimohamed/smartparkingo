package org.example.smartparking.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GuardManualReservationRequest {
    @NotNull(message = "Reservation id is required")
    private Long reservationId;
}
