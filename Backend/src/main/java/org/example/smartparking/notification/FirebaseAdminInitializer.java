package org.example.smartparking.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class FirebaseAdminInitializer {

    private final ObjectMapper objectMapper;

    @PostConstruct
    public void init() {
        if (!FirebaseApp.getApps().isEmpty()) {
            log.info("Firebase already initialized");
            return;
        }

        String json = System.getenv("FIREBASE_SERVICE_ACCOUNT_JSON");
        if (json == null || json.isBlank()) {
            log.info("Firebase disabled: FIREBASE_SERVICE_ACCOUNT_JSON not set");
            return;
        }

        try {
            Map<?, ?> parsed = objectMapper.readValue(json, Map.class);
            String normalized = objectMapper.writeValueAsString(parsed);
            GoogleCredentials credentials = GoogleCredentials.fromStream(
                    new ByteArrayInputStream(normalized.getBytes(StandardCharsets.UTF_8))
            );

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(credentials)
                    .build();
            FirebaseApp.initializeApp(options);
            log.info("Firebase initialized successfully");
        } catch (Exception e) {
            log.warn("Firebase init failed; pushes disabled", e);
        }
    }
}

