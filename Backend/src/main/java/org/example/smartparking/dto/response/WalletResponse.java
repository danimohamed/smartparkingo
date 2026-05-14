package org.example.smartparking.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class WalletResponse {
    private Long id;
    private Double balance;
    private LocalDateTime updatedAt;
}

