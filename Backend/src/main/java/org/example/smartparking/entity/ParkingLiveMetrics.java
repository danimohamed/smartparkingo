package org.example.smartparking.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Live occupancy snapshot written by the analytics worker (Approach A — DB as source of truth for dashboard).
 */
@Entity
@Table(name = "parking_live_metrics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParkingLiveMetrics {

    @Id
    @Column(name = "parking_id")
    private Long parkingId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "parking_id")
    private Parking parking;

    @Column(nullable = false)
    @Builder.Default
    private Integer carsInFrame = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer enteredCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer exitedCount = 0;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
