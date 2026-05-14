package org.example.smartparking.repository;

import org.example.smartparking.entity.ParkingGuard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParkingGuardRepository extends JpaRepository<ParkingGuard, Long> {

    List<ParkingGuard> findByParking_IdOrderByIdAsc(Long parkingId);

    void deleteByParking_Id(Long parkingId);

    boolean existsByParking_IdAndUser_Id(Long parkingId, Long userId);
}
