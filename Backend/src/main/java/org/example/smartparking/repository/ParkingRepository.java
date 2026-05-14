package org.example.smartparking.repository;

import org.example.smartparking.entity.Parking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParkingRepository extends JpaRepository<Parking, Long> {
    List<Parking> findByActiveTrue();
    List<Parking> findByNameContainingIgnoreCase(String name);
    List<Parking> findByOwnerId(Long ownerId);
    long countByOwnerId(Long ownerId);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
}

