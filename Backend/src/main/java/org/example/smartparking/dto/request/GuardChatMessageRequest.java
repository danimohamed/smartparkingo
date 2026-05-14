package org.example.smartparking.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GuardChatMessageRequest {

    @NotBlank
    @Size(max = 4000)
    private String body;
}
