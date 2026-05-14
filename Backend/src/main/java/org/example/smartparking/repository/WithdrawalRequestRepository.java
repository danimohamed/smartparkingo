package org.example.smartparking.repository;

import org.example.smartparking.entity.WithdrawalRequest;
import org.example.smartparking.entity.WithdrawalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WithdrawalRequestRepository extends JpaRepository<WithdrawalRequest, Long> {
    List<WithdrawalRequest> findByOwnerId(Long ownerId);
    List<WithdrawalRequest> findByStatus(WithdrawalStatus status);

    @Query("SELECT COALESCE(SUM(w.amount), 0) FROM WithdrawalRequest w WHERE w.owner.id = :ownerId AND w.status IN ('PENDING', 'APPROVED')")
    Double getTotalWithdrawnByOwnerId(@Param("ownerId") Long ownerId);

    @Query("SELECT COALESCE(SUM(w.amount), 0) FROM WithdrawalRequest w WHERE w.status IN ('PENDING', 'APPROVED')")
    Double getTotalWithdrawn();
}
