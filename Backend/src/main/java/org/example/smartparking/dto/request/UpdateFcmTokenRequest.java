package org.example.smartparking.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateFcmTokenRequest {
    @NotBlank
    private String token;
}

