package org.example.smartparking.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class WalletTransactionResponse {
    private Long id;
    private String type;
    private Double amount;
    private String description;
    private String cardLast4;
    private LocalDateTime createdAt;
}

