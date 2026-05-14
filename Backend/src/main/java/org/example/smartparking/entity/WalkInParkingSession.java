package org.example.smartparking.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Cash / walk-in vehicle tracked by license plate (no app reservation).
 */
@Entity
@Table(name = "walk_in_parking_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalkInParkingSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "parking_id", nullable = false)
    private Parking parking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parking_slot_id")
    private ParkingSlot parkingSlot;

    @Column(name = "plate_normalized", nullable = false, length = 32)
    private String plateNormalized;

    @Column(name = "plate_raw", length = 64)
    private String plateRaw;

    @Column(name = "entry_time", nullable = false)
    private LocalDateTime entryTime;

    @Column(name = "exit_time")
    private LocalDateTime exitTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private WalkInSessionStatus status = WalkInSessionStatus.ACTIVE;

    @Column(name = "price_per_hour_snapshot", nullable = false)
    private Double pricePerHourSnapshot;

    @Column(name = "amount_due")
    private Double amountDue;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entry_guard_user_id")
    private User entryGuard;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exit_guard_user_id")
    private User exitGuard;

    @Column(length = 500)
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
