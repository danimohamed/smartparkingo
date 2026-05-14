package org.example.smartparking.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChangeRoleRequest {
    @NotBlank(message = "Role is required")
    private String role;

    /** When role is GUARD: parking lot this guard monitors. */
    private Long assignedParkingId;
}

