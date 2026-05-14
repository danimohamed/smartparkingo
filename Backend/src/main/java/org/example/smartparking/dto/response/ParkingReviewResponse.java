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
public class ParkingReviewResponse {
    private Long id;
    private Integer rating;
    private String comment;
    private Long userId;
    private String userFullName;
    private LocalDateTime createdAt;
}

