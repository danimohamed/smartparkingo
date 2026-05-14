package org.example.smartparking.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminWalletResponse {
    private Long id;
    private Long userId;
    private String fullName;
    private String email;
    private Double balance;
    private LocalDateTime updatedAt;
}

