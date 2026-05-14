package org.example.smartparking.service;

import org.example.smartparking.dto.request.GuardChatMessageRequest;
import org.example.smartparking.dto.response.GuardChatMessageResponse;
import org.example.smartparking.dto.response.GuardChatSummaryResponse;
import org.example.smartparking.entity.Parking;
import org.example.smartparking.entity.User;

import java.util.List;

public interface GuardChatService {

    /**
     * For each guard assigned to the parking, ensure a chat exists and append a booking notice.
     * Guards come from {@code parking_guards} and/or legacy {@code users.assigned_parking_id}.
     */
    /**
     * @return chat row ids created/updated for each guard (empty if no guards)
     */
    List<Long> ensureChatsAfterReservation(User customer, Parking parking, Long reservationId, List<User> guards);

    List<GuardChatSummaryResponse> listMyChats(String userEmail);

    List<GuardChatMessageResponse> listMessages(Long chatId, String userEmail);

    GuardChatMessageResponse sendMessage(Long chatId, GuardChatMessageRequest request, String userEmail);
}
