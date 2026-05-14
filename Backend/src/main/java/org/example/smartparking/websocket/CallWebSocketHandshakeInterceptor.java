package org.example.smartparking.websocket;

import lombok.RequiredArgsConstructor;
import org.example.smartparking.entity.User;
import org.example.smartparking.repository.UserRepository;
import org.example.smartparking.security.JwtTokenProvider;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.net.URI;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class CallWebSocketHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler,
                                   Map<String, Object> attributes) {
        URI uri = request.getURI();
        String query = uri.getQuery();
        String token = QueryString.get(query, "token");
        String room = QueryString.get(query, "room"); // chatId

        if (token == null || token.isBlank() || !jwtTokenProvider.validateToken(token)) {
            return false;
        }
        if (room == null || room.isBlank()) {
            return false;
        }

        String email = jwtTokenProvider.getUsernameFromToken(token);
        User me = userRepository.findByEmail(email).orElse(null);
        if (me == null) return false;

        attributes.put("userId", me.getId());
        attributes.put("email", me.getEmail());
        attributes.put("room", room);
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler,
                               Exception exception) {
        // no-op
    }
}

