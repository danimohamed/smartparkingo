package org.example.smartparking.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.smartparking.dto.request.GuardChatMessageRequest;
import org.example.smartparking.dto.response.GuardChatMessageResponse;
import org.example.smartparking.dto.response.GuardChatSummaryResponse;
import org.example.smartparking.entity.*;
import org.example.smartparking.exception.BadRequestException;
import org.example.smartparking.exception.ResourceNotFoundException;
import org.example.smartparking.repository.GuardChatMessageRepository;
import org.example.smartparking.repository.GuardChatRepository;
import org.example.smartparking.repository.UserRepository;
import org.example.smartparking.service.GuardChatService;
import org.example.smartparking.notification.PushNotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GuardChatServiceImpl implements GuardChatService {

    private final GuardChatRepository guardChatRepository;
    private final GuardChatMessageRepository guardChatMessageRepository;
    private final UserRepository userRepository;
    @Autowired(required = false)
    private PushNotificationService pushNotificationService;

    @Override
    @Transactional
    public List<Long> ensureChatsAfterReservation(
            User customer,
            Parking parking,
            Long reservationId,
            List<User> guards) {
        if (guards == null || guards.isEmpty()) {
            return List.of();
        }
        List<Long> chatIds = new ArrayList<>();
        String notice = "Reservation #" + reservationId + " confirmed at « " + parking.getName() + " ». You can coordinate here.";
        for (User guard : guards) {
            GuardChat chat = guardChatRepository
                    .findByCustomer_IdAndGuard_IdAndParking_Id(customer.getId(), guard.getId(), parking.getId())
                    .orElseGet(() -> guardChatRepository.save(GuardChat.builder()
                            .customer(customer)
                            .guard(guard)
                            .parking(parking)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build()));

            GuardChatMessage msg = GuardChatMessage.builder()
                    .chat(chat)
                    .sender(null)
                    .body(notice)
                    .systemMessage(true)
                    .createdAt(LocalDateTime.now())
                    .build();
            guardChatMessageRepository.save(msg);

            chat.setUpdatedAt(LocalDateTime.now());
            guardChatRepository.save(chat);
            chatIds.add(chat.getId());
        }
        return chatIds;
    }

    @Override
    @Transactional(readOnly = true)
    public List<GuardChatSummaryResponse> listMyChats(String userEmail) {
        User me = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        List<GuardChat> chats = guardChatRepository.findByCustomer_IdOrGuard_IdOrderByUpdatedAtDesc(
                me.getId(), me.getId());
        return chats.stream().map(c -> toSummary(c, me)).collect(Collectors.toList());
    }

    private GuardChatSummaryResponse toSummary(GuardChat chat, User me) {
        boolean iamCustomer = me.getId().equals(chat.getCustomer().getId());
        User peer = iamCustomer ? chat.getGuard() : chat.getCustomer();
        return GuardChatSummaryResponse.builder()
                .id(chat.getId())
                .parkingId(chat.getParking().getId())
                .parkingName(chat.getParking().getName())
                .peerUserId(peer.getId())
                .peerFullName(peer.getFullName())
                .peerRole(peer.getRole().name())
                .guardPhone(chat.getGuard() != null ? chat.getGuard().getPhone() : null)
                .updatedAt(chat.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<GuardChatMessageResponse> listMessages(Long chatId, String userEmail) {
        User me = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        GuardChat chat = guardChatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));
        assertParticipant(me, chat);
        return guardChatMessageRepository.findByChat_IdOrderByCreatedAtAsc(chatId).stream()
                .map(m -> toMessageResponse(m, me.getId()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public GuardChatMessageResponse sendMessage(Long chatId, GuardChatMessageRequest request, String userEmail) {
        User me = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        GuardChat chat = guardChatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));
        assertParticipant(me, chat);

        GuardChatMessage msg = GuardChatMessage.builder()
                .chat(chat)
                .sender(me)
                .body(request.getBody().trim())
                .systemMessage(false)
                .createdAt(LocalDateTime.now())
                .build();
        msg = guardChatMessageRepository.save(msg);
        chat.setUpdatedAt(LocalDateTime.now());
        guardChatRepository.save(chat);

        // Push notify the other participant (if they have an FCM token).
        User peer = me.getId().equals(chat.getCustomer().getId()) ? chat.getGuard() : chat.getCustomer();
        Map<String, String> data = new HashMap<>();
        data.put("type", "guard_message");
        data.put("chatId", String.valueOf(chat.getId()));
        data.put("fromUserId", String.valueOf(me.getId()));
        if (pushNotificationService != null) {
            pushNotificationService.sendToUser(peer, "New message", request.getBody().trim(), data);
        }

        return toMessageResponse(msg, me.getId());
    }

    private void assertParticipant(User me, GuardChat chat) {
        Long uid = me.getId();
        if (!uid.equals(chat.getCustomer().getId()) && !uid.equals(chat.getGuard().getId())) {
            throw new BadRequestException("You are not a participant in this chat");
        }
    }

    private GuardChatMessageResponse toMessageResponse(GuardChatMessage m, Long viewerUserId) {
        Long sid = m.getSender() != null ? m.getSender().getId() : null;
        String name = m.getSender() != null ? m.getSender().getFullName() : null;
        boolean fromMe = !m.isSystemMessage() && sid != null && sid.equals(viewerUserId);
        return GuardChatMessageResponse.builder()
                .id(m.getId())
                .senderUserId(sid)
                .senderFullName(name)
                .body(m.getBody())
                .systemMessage(m.isSystemMessage())
                .fromMe(fromMe)
                .createdAt(m.getCreatedAt())
                .build();
    }
}
