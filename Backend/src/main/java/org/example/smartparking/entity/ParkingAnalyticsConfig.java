package org.example.smartparking.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Static camera / sample-video configuration and slot regions (normalized 0–1 rects) for vision analytics.
 */
@Entity
@Table(name = "parking_analytics_config")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParkingAnalyticsConfig {

    @Id
    @Column(name = "parking_id")
    private Long parkingId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "parking_id")
    private Parking parking;

    /** e.g. video1.mp4 under owner-analytics/sample-videos */
    @Column(nullable = false, length = 255)
    private String sampleVideoFilename;

    /** JSON: [{ "id": "S1", "rect": [nx, ny, nw, nh] }, ...] normalized to frame width/height */
    @Lob
    @Column(name = "slot_regions_json", columnDefinition = "MEDIUMTEXT", nullable = false)
    private String slotRegionsJson;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
