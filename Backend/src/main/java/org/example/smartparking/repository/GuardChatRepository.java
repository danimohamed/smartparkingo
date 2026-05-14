package org.example.smartparking.repository;

import org.example.smartparking.entity.GuardChat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GuardChatRepository extends JpaRepository<GuardChat, Long> {

    Optional<GuardChat> findByCustomer_IdAndGuard_IdAndParking_Id(
            Long customerId, Long guardUserId, Long parkingId);

    List<GuardChat> findByCustomer_IdOrGuard_IdOrderByUpdatedAtDesc(Long customerId, Long guardUserId);
}
