package org.example.smartparking.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class CallWebSocketConfig implements WebSocketConfigurer {

    private final CallWebSocketHandler callWebSocketHandler;
    private final CallWebSocketHandshakeInterceptor callWebSocketHandshakeInterceptor;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(callWebSocketHandler, "/ws/call")
                .addInterceptors(callWebSocketHandshakeInterceptor)
                .setAllowedOrigins(
                        "http://localhost:3000",
                        "https://parkingo.app",
                        "https://www.parkingo.app",
                        "https://smartparking-web-eu-ca1236d7d681.herokuapp.com"
                );
    }
}

