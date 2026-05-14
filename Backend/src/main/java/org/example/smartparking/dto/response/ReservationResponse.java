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
public class ReservationResponse {
    private Long id;
    private Long userId;
    private String userFullName;
    private Long parkingSlotId;
    private String slotNumber;
    private String parkingName;
    /** Parking this reservation belongs to (for client navigation, e.g. guard chat). */
    private Long parkingId;
    /** Guard chat thread ids created/updated when booking at a guarded parking (empty if none). */
    private List<Long> guardChatIds;
    private String vehiclePlate;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
    private Double totalPrice;
    private String paymentStatus;
    private String paymentMethod;
    private LocalDateTime createdAt;
    private Integer gracePeriodMinutes;
    private LocalDateTime actualArrival;
    private LocalDateTime actualDeparture;
    private Boolean checkedIn;
    private Boolean checkedOut;
    private String vehiclePlateNormalized;
}

