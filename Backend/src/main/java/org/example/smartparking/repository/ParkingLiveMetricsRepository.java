package org.example.smartparking.repository;

import org.example.smartparking.entity.ParkingLiveMetrics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ParkingLiveMetricsRepository extends JpaRepository<ParkingLiveMetrics, Long> {
}
