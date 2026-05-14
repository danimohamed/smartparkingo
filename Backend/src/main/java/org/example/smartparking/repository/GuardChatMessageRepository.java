package org.example.smartparking.repository;

import org.example.smartparking.entity.GuardChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GuardChatMessageRepository extends JpaRepository<GuardChatMessage, Long> {

    List<GuardChatMessage> findByChat_IdOrderByCreatedAtAsc(Long chatId);
}
