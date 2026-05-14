package org.example.smartparking.repository;

import jakarta.persistence.LockModeType;
import org.example.smartparking.entity.ParkingSlot;
import org.example.smartparking.entity.SlotStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ParkingSlotRepository extends JpaRepository<ParkingSlot, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ps FROM ParkingSlot ps JOIN FETCH ps.parking p WHERE ps.id = :id")
    Optional<ParkingSlot> findByIdForUpdate(@Param("id") Long id);
    List<ParkingSlot> findByParkingId(Long parkingId);
    List<ParkingSlot> findByParkingIdAndStatus(Long parkingId, SlotStatus status);
    long countByParkingIdAndStatus(Long parkingId, SlotStatus status);
    long countByStatus(SlotStatus status);
    long countByParkingOwnerId(Long ownerId);
}


