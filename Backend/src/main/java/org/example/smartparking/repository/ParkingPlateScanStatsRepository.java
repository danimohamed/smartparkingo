package org.example.smartparking.repository;

import org.example.smartparking.entity.ParkingPlateScanStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface ParkingPlateScanStatsRepository extends JpaRepository<ParkingPlateScanStats, Long> {

    Optional<ParkingPlateScanStats> findByParking_IdAndStatDate(Long parkingId, LocalDate statDate);

    @Query("SELECT COALESCE(SUM(s.appUsersCount), 0) FROM ParkingPlateScanStats s " +
            "WHERE s.statDate = :statDate AND s.parking.owner.id = :ownerId")
    long sumAppUsersByOwnerAndDate(@Param("ownerId") Long ownerId, @Param("statDate") LocalDate statDate);

    @Query("SELECT COALESCE(SUM(s.nonAppUsersCount), 0) FROM ParkingPlateScanStats s " +
            "WHERE s.statDate = :statDate AND s.parking.owner.id = :ownerId")
    long sumNonAppUsersByOwnerAndDate(@Param("ownerId") Long ownerId, @Param("statDate") LocalDate statDate);

    @Modifying
    @Query(value = """
            INSERT INTO parking_plate_scan_stats (parking_id, stat_date, app_users_count, non_app_users_count)
            VALUES (:parkingId, :statDate, 1, 0)
            ON DUPLICATE KEY UPDATE app_users_count = app_users_count + 1
            """, nativeQuery = true)
    void incrementAppUsers(@Param("parkingId") Long parkingId, @Param("statDate") LocalDate statDate);

    @Modifying
    @Query(value = """
            INSERT INTO parking_plate_scan_stats (parking_id, stat_date, app_users_count, non_app_users_count)
            VALUES (:parkingId, :statDate, 0, 1)
            ON DUPLICATE KEY UPDATE non_app_users_count = non_app_users_count + 1
            """, nativeQuery = true)
    void incrementNonAppUsers(@Param("parkingId") Long parkingId, @Param("statDate") LocalDate statDate);
}

