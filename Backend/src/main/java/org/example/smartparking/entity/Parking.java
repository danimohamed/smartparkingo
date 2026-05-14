package org.example.smartparking.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "parkings")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Parking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150, unique = true)
    private String name;

    @Column(nullable = false, length = 255)
    private String address;

    @Column(length = 500)
    private String description;

    /** Public image URL for UI cards (optional). */
    @Lob
    @Column(name = "image_url", columnDefinition = "MEDIUMTEXT")
    private String imageUrl;

    @Column(nullable = false)
    private Integer totalSlots;

    @Column(nullable = false)
    private Double pricePerHour;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PricingTier pricingTier = PricingTier.STANDARD;

    /** Max charge for one reservation session (MAD). If null, derived from pricingTier. */
    @Column
    private Double dailyCapPrice;

    @Column(columnDefinition = "BOOLEAN DEFAULT TRUE")
    @Builder.Default
    private Boolean active = true;

    @Column
    private Double latitude;

    @Column
    private Double longitude;

    /** Optional layout metadata used by clients (e.g., floor selector). */
    @Column(name = "layout_floors")
    private Integer layoutFloors;

    @Column(name = "layout_spots_per_floor")
    private Integer layoutSpotsPerFloor;

    @Column(name = "underground_floors")
    private Boolean undergroundFloors;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @OneToMany(mappedBy = "parking", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ParkingSlot> parkingSlots = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

