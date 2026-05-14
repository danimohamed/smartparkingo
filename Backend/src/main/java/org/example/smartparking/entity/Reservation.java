package org.example.smartparking.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "reservations")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parking_slot_id", nullable = false)
    private ParkingSlot parkingSlot;

    @Column(name = "vehicle_plate_normalized", length = 64)
    private String vehiclePlateNormalized;

    @Column(name = "vehicle_plate_raw", length = 64)
    private String vehiclePlateRaw;

    @Column(nullable = false)
    private LocalDateTime startTime;

    @Column(nullable = false)
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ReservationStatus status = ReservationStatus.ACTIVE;

    @Column(nullable = false)
    private Double totalPrice;

    /** Minutes free at start of booked window (pricing grace). Default 15. */
    @Column(nullable = false)
    @Builder.Default
    private Integer gracePeriodMinutes = 15;

    @Column
    private LocalDateTime actualArrival;

    @Column
    private LocalDateTime actualDeparture;

    @Column(nullable = false)
    @Builder.Default
    private Boolean checkedIn = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean checkedOut = false;

    /**
     * Reminder push sent shortly before endTime.
     * Prevents sending the same reminder multiple times.
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean endingSoonNotified = false;

    @Column(name = "vehicle_plate", length = 64)
    private String vehiclePlate;


    @OneToOne(mappedBy = "reservation", cascade = CascadeType.ALL, orphanRemoval = true)
    private Payment payment;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

