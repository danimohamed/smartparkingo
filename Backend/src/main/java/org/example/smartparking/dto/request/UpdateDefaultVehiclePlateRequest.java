package org.example.smartparking.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Clears saved default when {@code defaultVehiclePlate} is null or blank after trim.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDefaultVehiclePlateRequest {

    @Size(max = 64, message = "Vehicle plate must not exceed 64 characters")
    private String defaultVehiclePlate;
}
