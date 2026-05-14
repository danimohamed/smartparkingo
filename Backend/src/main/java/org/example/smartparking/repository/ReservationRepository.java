package org.example.smartparking.repository;

import org.example.smartparking.entity.Reservation;
import org.example.smartparking.entity.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByUserId(Long userId);
    List<Reservation> findByUserIdAndStatus(Long userId, ReservationStatus status);

    long countByStatus(ReservationStatus status);

    @Query("SELECT r FROM Reservation r WHERE r.parkingSlot.id = :slotId " +
            "AND r.status = 'ACTIVE' " +
            "AND r.startTime < :endTime AND r.endTime > :startTime")
    List<Reservation> findConflictingReservations(
            @Param("slotId") Long slotId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query("SELECT COUNT(r) FROM Reservation r WHERE r.status = 'ACTIVE'")
    long countActiveReservations();

    @Query("SELECT COUNT(r) FROM Reservation r WHERE r.createdAt >= :since")
    long countReservationsSince(@Param("since") LocalDateTime since);

    @Query("SELECT r FROM Reservation r " +
            "JOIN FETCH r.user " +
            "JOIN FETCH r.parkingSlot ps " +
            "JOIN FETCH ps.parking")
    List<Reservation> findAllWithDetails();

    @Query("SELECT r FROM Reservation r " +
            "JOIN FETCH r.user " +
            "JOIN FETCH r.parkingSlot ps " +
            "JOIN FETCH ps.parking " +
            "WHERE r.user.id = :userId")
    List<Reservation> findByUserIdWithDetails(@Param("userId") Long userId);

    @Query("SELECT r FROM Reservation r " +
            "JOIN FETCH r.user " +
            "JOIN FETCH r.parkingSlot ps " +
            "JOIN FETCH ps.parking p " +
            "WHERE p.owner.id = :ownerId")
    List<Reservation> findByOwnerIdWithDetails(@Param("ownerId") Long ownerId);

    @Query("SELECT COUNT(r) FROM Reservation r WHERE r.parkingSlot.parking.owner.id = :ownerId AND r.status = 'ACTIVE'")
    long countActiveByOwnerId(@Param("ownerId") Long ownerId);

    @Query("SELECT r FROM Reservation r " +
            "JOIN FETCH r.parkingSlot ps " +
            "JOIN FETCH ps.parking " +
            "WHERE r.status = 'ACTIVE' AND r.endTime <= :now")
    List<Reservation> findExpiredActiveReservations(@Param("now") LocalDateTime now);

    @Query("SELECT r FROM Reservation r " +
            "JOIN FETCH r.user " +
            "JOIN FETCH r.parkingSlot ps " +
            "JOIN FETCH ps.parking " +
            "LEFT JOIN FETCH r.payment " +
            "WHERE r.id = :id")
    Optional<Reservation> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT r FROM Reservation r " +
            "JOIN FETCH r.user " +
            "JOIN FETCH r.parkingSlot ps " +
            "JOIN FETCH ps.parking p " +
            "LEFT JOIN FETCH r.payment " +
            "WHERE p.id = :parkingId AND r.status = 'ACTIVE' " +
            "AND r.startTime < :dayEnd AND r.endTime > :dayStart")
    List<Reservation> findActiveForParkingOverlappingInterval(
            @Param("parkingId") Long parkingId,
            @Param("dayStart") LocalDateTime dayStart,
            @Param("dayEnd") LocalDateTime dayEnd);

    @Query("SELECT r FROM Reservation r " +
            "JOIN FETCH r.user " +
            "JOIN FETCH r.parkingSlot ps " +
            "JOIN FETCH ps.parking p " +
            "LEFT JOIN FETCH r.payment " +
            "WHERE p.id = :parkingId AND r.status = 'ACTIVE' " +
            "AND r.vehiclePlateNormalized = :plateNormalized " +
            "AND r.startTime < :dayEnd AND r.endTime > :dayStart")
    List<Reservation> findActiveForParkingAndPlateOverlappingInterval(
            @Param("parkingId") Long parkingId,
            @Param("plateNormalized") String plateNormalized,
            @Param("dayStart") LocalDateTime dayStart,
            @Param("dayEnd") LocalDateTime dayEnd);

    @Query("SELECT r FROM Reservation r " +
            "JOIN FETCH r.parkingSlot ps " +
            "JOIN FETCH r.user " +
            "LEFT JOIN FETCH r.payment " +
            "WHERE r.status = 'ACTIVE' AND r.checkedIn = false AND r.startTime < :threshold")
    List<Reservation> findNoShowCandidates(@Param("threshold") LocalDateTime threshold);

    @Query("SELECT r FROM Reservation r " +
            "JOIN FETCH r.user " +
            "JOIN FETCH r.parkingSlot ps " +
            "JOIN FETCH ps.parking " +
            "WHERE r.status = 'ACTIVE' " +
            "AND r.endingSoonNotified = false " +
            "AND r.endTime > :windowStart AND r.endTime <= :windowEnd")
    List<Reservation> findEndingSoonCandidates(
            @Param("windowStart") LocalDateTime windowStart,
            @Param("windowEnd") LocalDateTime windowEnd);
}

