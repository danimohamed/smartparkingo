package org.example.smartparking.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParkingResponse {
    private Long id;
    private String name;
    private String address;
    private String description;
    private String imageUrl;
    private Integer totalSlots;
    private Long availableSlots;
    private Double pricePerHour;
    private String pricingTier;
    private Double dailyCapPrice;
    private Integer layoutFloors;
    private Integer layoutSpotsPerFloor;
    private Boolean undergroundFloors;
    private Double avgRating;
    private Long reviewCount;
    private Boolean active;
    private Double latitude;
    private Double longitude;
    private Long ownerId;
    private String ownerName;
    private Long guardId;
    private String guardName;
    private String guardPhone;

    /** Explicit + legacy assigned guards for this parking. */
    private List<ParkingGuardSummary> guardians;

    private LocalDateTime createdAt;
}

