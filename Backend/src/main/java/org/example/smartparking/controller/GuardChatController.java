package org.example.smartparking.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.smartparking.dto.request.GuardChatMessageRequest;
import org.example.smartparking.dto.response.ApiResponse;
import org.example.smartparking.dto.response.GuardChatMessageResponse;
import org.example.smartparking.dto.response.GuardChatSummaryResponse;
import org.example.smartparking.service.GuardChatService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
public class GuardChatController {

    private final GuardChatService guardChatService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<GuardChatSummaryResponse>>> list(Authentication authentication) {
        List<GuardChatSummaryResponse> data = guardChatService.listMyChats(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<List<GuardChatMessageResponse>>> messages(
            @PathVariable Long id,
            Authentication authentication) {
        List<GuardChatMessageResponse> data = guardChatService.listMessages(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<GuardChatMessageResponse>> send(
            @PathVariable Long id,
            @Valid @RequestBody GuardChatMessageRequest request,
            Authentication authentication) {
        GuardChatMessageResponse data = guardChatService.sendMessage(id, request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Message sent", data));
    }
}
