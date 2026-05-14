package org.example.smartparking.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ParkingRequest {

    @NotBlank(message = "Parking name is required")
    @Size(max = 150, message = "Name must not exceed 150 characters")
    private String name;

    @NotBlank(message = "Address is required")
    @Size(max = 255, message = "Address must not exceed 255 characters")
    private String address;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    /** Public image URL for cards/screens (optional). */
    @Size(max = 5_000_000, message = "Image URL must not exceed 5,000,000 characters")
    private String imageUrl;

    /**
     * Required when {@code layoutFloors} / {@code layoutSpotsPerFloor} are omitted.
     * When layout fields are set, must match {@code layoutFloors × layoutSpotsPerFloor}.
     */
    private Integer totalSlots;

    @NotNull(message = "Price per hour is required")
    @Positive(message = "Price per hour must be positive")
    private Double pricePerHour;

    private Double latitude;

    private Double longitude;

    /** STANDARD, PREMIUM, or ECONOMY — optional, defaults to STANDARD */
    private String pricingTier;

    /** Daily cap in MAD for one reservation; optional, defaults by tier */
    private Double dailyCapPrice;

    /** With {@link #layoutSpotsPerFloor}, generates slots for the 3D twin (max 10 floors × 50 spots/floor). */
    private Integer layoutFloors;

    /** Spots on each floor (same layout repeated per floor). */
    private Integer layoutSpotsPerFloor;

    /** If true, floor labels are underground (-1, -2, …); otherwise RDC, 1, 2, … */
    private Boolean undergroundFloors;

    /** On create: optional guard user ids to attach to this parking. */
    private List<Long> guardUserIds = new ArrayList<>();
}

