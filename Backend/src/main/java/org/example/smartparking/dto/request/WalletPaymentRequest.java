package org.example.smartparking.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class WalletPaymentRequest {

    @NotNull(message = "Reservation ID is required")
    private Long reservationId;
}

