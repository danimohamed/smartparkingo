package org.example.smartparking.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GuardPlateEntryRequest {

    @NotNull
    private Long parkingId;

    /** Raw or OCR-read plate; normalized server-side. */
    @NotBlank
    @Size(min = 4, max = 64)
    private String plate;

    /** Optional: occupy this slot for the walk-in. */
    private Long parkingSlotId;

    @Size(max = 500)
    private String notes;
}
