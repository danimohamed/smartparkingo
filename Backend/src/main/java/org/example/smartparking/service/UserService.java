package org.example.smartparking.service;

import org.example.smartparking.dto.request.ChangePasswordRequest;
import org.example.smartparking.dto.request.UpdateDefaultVehiclePlateRequest;
import org.example.smartparking.dto.request.UpdateFcmTokenRequest;
import org.example.smartparking.dto.request.UpdateProfileRequest;
import org.example.smartparking.dto.response.UserResponse;

public interface UserService {
    UserResponse getCurrentUser(String email);
    UserResponse updateProfile(String email, UpdateProfileRequest request);

    UserResponse updateDefaultVehiclePlate(String email, UpdateDefaultVehiclePlateRequest request);

    void changePassword(String email, ChangePasswordRequest request);
    void updateFcmToken(String email, UpdateFcmTokenRequest request);
}
