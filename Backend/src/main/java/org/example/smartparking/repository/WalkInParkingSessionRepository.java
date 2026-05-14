package org.example.smartparking.repository;

import org.example.smartparking.entity.WalkInParkingSession;
import org.example.smartparking.entity.WalkInSessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WalkInParkingSessionRepository extends JpaRepository<WalkInParkingSession, Long> {

    Optional<WalkInParkingSession> findByParking_IdAndPlateNormalizedAndStatus(
            Long parkingId, String plateNormalized, WalkInSessionStatus status);

    List<WalkInParkingSession> findByParking_IdAndStatusOrderByEntryTimeDesc(
            Long parkingId, WalkInSessionStatus status);
}
