package org.example.smartparking.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GuardPlateExitRequest {

    @NotNull
    private Long parkingId;

    @NotBlank
    @Size(min = 4, max = 64)
    private String plate;

    /** If true, exit is recorded as paid on the spot (cash). Otherwise UNPAID with amount due. */
    private Boolean paidOnExit;
}
