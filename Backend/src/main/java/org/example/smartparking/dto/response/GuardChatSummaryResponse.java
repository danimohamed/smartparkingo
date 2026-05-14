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
public class GuardChatSummaryResponse {
    private Long id;
    private Long parkingId;
    private String parkingName;
    private Long peerUserId;
    private String peerFullName;
    private String peerRole;
    /** Phone number to call the guard (when applicable). */
    private String guardPhone;
    private LocalDateTime updatedAt;
}
