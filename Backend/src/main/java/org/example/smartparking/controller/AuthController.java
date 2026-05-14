package org.example.smartparking.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.smartparking.dto.request.LoginRequest;
import org.example.smartparking.dto.request.OAuthLoginRequest;
import org.example.smartparking.dto.request.RegisterRequest;
import org.example.smartparking.dto.response.ApiResponse;
import org.example.smartparking.dto.response.AuthResponse;
import org.example.smartparking.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User registered successfully", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/register-admin")
    public ResponseEntity<ApiResponse<AuthResponse>> registerAdmin(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.registerAdmin(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Admin registered successfully", response));
    }

    @PostMapping("/register-owner")
    public ResponseEntity<ApiResponse<AuthResponse>> registerOwner(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.registerOwner(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Parking owner registered successfully", response));
    }

    @PostMapping("/oauth-login")
    public ResponseEntity<ApiResponse<AuthResponse>> oauthLogin(@Valid @RequestBody OAuthLoginRequest request) {
        AuthResponse response = authService.oauthLogin(request);
        return ResponseEntity.ok(ApiResponse.success("OAuth login successful", response));
    }
}

