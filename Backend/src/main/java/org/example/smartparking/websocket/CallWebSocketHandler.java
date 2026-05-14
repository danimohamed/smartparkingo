package org.example.smartparking.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Minimal signaling relay for audio calls (WebRTC).
 *
 * Client connects to: ws(s)://<host>/ws/call?room=<chatId>&token=<jwt>
 * Server relays JSON messages to other peers in the same room.
 */
@Component
@RequiredArgsConstructor
public class CallWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();

    /** roomId -> sessions */
    private final Map<String, Set<WebSocketSession>> rooms = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String room = (String) session.getAttributes().get("room");
        rooms.computeIfAbsent(room, r -> ConcurrentHashMap.newKeySet()).add(session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        String room = (String) session.getAttributes().get("room");
        Long userId = (Long) session.getAttributes().get("userId");

        JsonNode root;
        try {
            root = objectMapper.readTree(message.getPayload());
        } catch (Exception e) {
            return;
        }

        // Always attach sender for the receiver.
        if (root.isObject()) {
            ((com.fasterxml.jackson.databind.node.ObjectNode) root).put("fromUserId", userId);
        }

        String outbound = objectMapper.writeValueAsString(root);
        for (WebSocketSession s : rooms.getOrDefault(room, Set.of())) {
            if (s == session) continue;
            if (!s.isOpen()) continue;
            s.sendMessage(new TextMessage(outbound));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String room = (String) session.getAttributes().get("room");
        Set<WebSocketSession> set = rooms.get(room);
        if (set != null) {
            set.remove(session);
            if (set.isEmpty()) {
                rooms.remove(room);
            }
        }
    }
}

