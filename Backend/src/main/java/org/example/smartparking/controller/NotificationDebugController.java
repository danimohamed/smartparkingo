package org.example.smartparking.controller;

import lombok.RequiredArgsConstructor;
import org.example.smartparking.dto.response.ApiResponse;
import org.example.smartparking.entity.User;
import org.example.smartparking.exception.ResourceNotFoundException;
import org.example.smartparking.notification.PushNotificationService;
import org.example.smartparking.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationDebugController {

    private final UserRepository userRepository;
    private final PushNotificationService pushNotificationService;

    @GetMapping("/me/test")
    public ResponseEntity<ApiResponse<Map<String, Object>>> test(Authentication authentication) {
        User me = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean enabled = pushNotificationService.isEnabled();
        boolean hasToken = me.getFcmToken() != null && !me.getFcmToken().isBlank();

        if (enabled && hasToken) {
            pushNotificationService.sendToUser(
                    me,
                    "Test notification",
                    "If you see this, FCM is working.",
                    Map.of("type", "test")
            );
        }

        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "pushEnabled", enabled,
                "hasToken", hasToken
        )));
    }
}

