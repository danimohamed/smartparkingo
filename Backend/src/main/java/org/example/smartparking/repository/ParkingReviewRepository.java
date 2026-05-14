package org.example.smartparking.repository;

import org.example.smartparking.entity.ParkingReview;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ParkingReviewRepository extends JpaRepository<ParkingReview, Long> {

    @Query("SELECT COALESCE(AVG(r.rating), 0) FROM ParkingReview r WHERE r.parking.id = :parkingId")
    Double getAvgRating(@Param("parkingId") Long parkingId);

    @Query("SELECT COUNT(r) FROM ParkingReview r WHERE r.parking.id = :parkingId")
    long countByParkingId(@Param("parkingId") Long parkingId);

    @Query("SELECT r FROM ParkingReview r JOIN FETCH r.user u WHERE r.parking.id = :parkingId ORDER BY r.createdAt DESC")
    List<ParkingReview> findLatestForParking(@Param("parkingId") Long parkingId, Pageable pageable);

    Optional<ParkingReview> findByParkingIdAndUserId(Long parkingId, Long userId);
}

