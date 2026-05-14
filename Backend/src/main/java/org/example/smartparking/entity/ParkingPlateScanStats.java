package org.example.smartparking.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(
        name = "parking_plate_scan_stats",
        uniqueConstraints = @UniqueConstraint(columnNames = {"parking_id", "stat_date"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParkingPlateScanStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "parking_id", nullable = false)
    private Parking parking;

    @Column(name = "stat_date", nullable = false)
    private LocalDate statDate;

    @Column(name = "app_users_count", nullable = false)
    private long appUsersCount;

    @Column(name = "non_app_users_count", nullable = false)
    private long nonAppUsersCount;
}

