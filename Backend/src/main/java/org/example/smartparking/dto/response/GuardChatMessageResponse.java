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
public class GuardChatMessageResponse {
    private Long id;
    private Long senderUserId;
    private String senderFullName;
    private String body;
    private boolean systemMessage;
    /** True when the current user sent this message */
    private boolean fromMe;
    private LocalDateTime createdAt;
}
