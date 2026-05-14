package org.example.smartparking.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InternalLiveMetricsRequest {

    @NotNull
    private Long parkingId;

    @NotNull
    private Integer carsInFrame;

    /** Total cars that entered (yellow line) since worker start. */
    @NotNull
    private Integer enteredCount;

    /** Total cars that exited (blue line) since worker start. */
    @NotNull
    private Integer exitedCount;
}
