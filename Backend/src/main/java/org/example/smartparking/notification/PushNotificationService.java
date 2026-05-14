package org.example.smartparking.notification;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import lombok.extern.slf4j.Slf4j;
import org.example.smartparking.entity.User;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@Slf4j
public class PushNotificationService {

    public boolean isEnabled() {
        return !FirebaseApp.getApps().isEmpty();
    }

    public void sendToUser(User user, String title, String body, Map<String, String> data) {
        if (!isEnabled()) return;
        if (user == null) return;
        String token = user.getFcmToken();
        if (token == null || token.isBlank()) return;

        try {
            Message.Builder builder = Message.builder()
                    .setToken(token)
                    .setNotification(Notification.builder().setTitle(title).setBody(body).build());
            if (data != null && !data.isEmpty()) {
                builder.putAllData(data);
            }
            FirebaseMessaging.getInstance().send(builder.build());
        } catch (Exception e) {
            log.warn("Failed to send push to userId={}", user.getId(), e);
        }
    }
}

