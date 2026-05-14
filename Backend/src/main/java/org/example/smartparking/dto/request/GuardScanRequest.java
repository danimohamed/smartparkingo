package org.example.smartparking.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GuardScanRequest {
    @NotBlank(message = "QR payload is required")
    private String qrPayload;
}
