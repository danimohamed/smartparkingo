package org.example.smartparking.service;

import org.example.smartparking.dto.request.LoginRequest;
import org.example.smartparking.dto.request.OAuthLoginRequest;
import org.example.smartparking.dto.request.RegisterRequest;
import org.example.smartparking.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse registerAdmin(RegisterRequest request);
    AuthResponse registerOwner(RegisterRequest request);
    AuthResponse oauthLogin(OAuthLoginRequest request);
}

