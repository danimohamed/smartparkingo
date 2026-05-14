package org.example.smartparking.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.smartparking.dto.request.ChangePasswordRequest;
import org.example.smartparking.dto.request.UpdateDefaultVehiclePlateRequest;
import org.example.smartparking.dto.request.UpdateFcmTokenRequest;
import org.example.smartparking.dto.request.UpdateProfileRequest;
import org.example.smartparking.dto.response.ApiResponse;
import org.example.smartparking.dto.response.UserResponse;
import org.example.smartparking.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(Authentication authentication) {
        UserResponse response = userService.getCurrentUser(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserResponse response = userService.updateProfile(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", response));
    }

    @PutMapping("/me/default-vehicle-plate")
    public ResponseEntity<ApiResponse<UserResponse>> updateDefaultVehiclePlate(
            Authentication authentication,
            @Valid @RequestBody UpdateDefaultVehiclePlateRequest request) {
        UserResponse response = userService.updateDefaultVehiclePlate(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Default vehicle plate updated", response));
    }

    @PutMapping("/me/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }

    @PutMapping("/me/fcm-token")
    public ResponseEntity<ApiResponse<Void>> updateFcmToken(
            Authentication authentication,
            @Valid @RequestBody UpdateFcmTokenRequest request) {
        userService.updateFcmToken(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("FCM token updated successfully", null));
    }
}
