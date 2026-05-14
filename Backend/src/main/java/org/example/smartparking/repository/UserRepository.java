package org.example.smartparking.repository;

import org.example.smartparking.entity.Role;
import org.example.smartparking.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findFirstByFullNameOrderByIdAsc(String fullName);
    boolean existsByEmail(String email);
    long countByRole(Role role);

    Optional<User> findFirstByRoleAndAssignedParking_Id(Role role, Long assignedParkingId);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.assignedParking WHERE u.email = :email")
    Optional<User> findByEmailWithAssignedParking(@Param("email") String email);

    List<User> findByRoleOrderByFullNameAsc(Role role);

    /** Guards linked via legacy {@code users.assigned_parking_id} (seed data). */
    List<User> findByRoleAndAssignedParking_Id(Role role, Long assignedParkingId);
}

