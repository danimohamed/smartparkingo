package org.example.smartparking.repository;

import org.example.smartparking.entity.ParkingAnalyticsConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ParkingAnalyticsConfigRepository extends JpaRepository<ParkingAnalyticsConfig, Long> {
}
