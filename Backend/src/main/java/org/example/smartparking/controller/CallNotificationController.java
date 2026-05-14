package org.example.smartparking.controller;

import lombok.RequiredArgsConstructor;
import org.example.smartparking.dto.response.ApiResponse;
import org.example.smartparking.entity.GuardChat;
import org.example.smartparking.entity.User;
import org.example.smartparking.exception.ResourceNotFoundException;
import org.example.smartparking.notification.PushNotificationService;
import org.example.smartparking.repository.GuardChatRepository;
import org.example.smartparking.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/calls")
@RequiredArgsConstructor
public class CallNotificationController {

    private final GuardChatRepository guardChatRepository;
    private final UserRepository userRepository;
    @Autowired(required = false)
    private PushNotificationService pushNotificationService;

    @PostMapping("/{chatId}/invite")
    public ResponseEntity<ApiResponse<Void>> invite(Authentication authentication, @PathVariable Long chatId) {
        User me = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        GuardChat chat = guardChatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));

        if (!me.getId().equals(chat.getCustomer().getId()) && !me.getId().equals(chat.getGuard().getId())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("You are not a participant in this chat"));
        }

        User peer = me.getId().equals(chat.getCustomer().getId()) ? chat.getGuard() : chat.getCustomer();

        Map<String, String> data = new HashMap<>();
        data.put("type", "call_invite");
        data.put("chatId", String.valueOf(chatId));
        data.put("fromUserId", String.valueOf(me.getId()));
        data.put("fromName", me.getFullName());

        if (pushNotificationService != null) {
            pushNotificationService.sendToUser(peer, "Incoming call", me.getFullName() + " is calling you", data);
        }
        return ResponseEntity.ok(ApiResponse.success("Invite sent", null));
    }
}

