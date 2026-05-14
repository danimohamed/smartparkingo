package org.example.smartparking.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.smartparking.dto.request.ChangePasswordRequest;
import org.example.smartparking.dto.request.UpdateDefaultVehiclePlateRequest;
import org.example.smartparking.dto.request.UpdateFcmTokenRequest;
import org.example.smartparking.dto.request.UpdateProfileRequest;
import org.example.smartparking.dto.response.UserResponse;
import org.example.smartparking.entity.User;
import org.example.smartparking.exception.BadRequestException;
import org.example.smartparking.exception.ResourceNotFoundException;
import org.example.smartparking.repository.UserRepository;
import org.example.smartparking.service.UserService;
import org.example.smartparking.util.PlateNormalizer;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmailWithAssignedParking(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapToResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());

        User saved = userRepository.save(user);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public UserResponse updateDefaultVehiclePlate(String email, UpdateDefaultVehiclePlateRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String raw = request.getDefaultVehiclePlate() != null
                ? request.getDefaultVehiclePlate().trim()
                : "";
        if (raw.isEmpty()) {
            user.setDefaultVehiclePlate(null);
        } else {
            String normalized = PlateNormalizer.normalize(raw);
            if (!PlateNormalizer.isValid(normalized)) {
                throw new BadRequestException("Invalid vehicle plate");
            }
            user.setDefaultVehiclePlate(normalized);
        }

        return mapToResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("New password and confirmation do not match");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void updateFcmToken(String email, UpdateFcmTokenRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setFcmToken(request.getToken());
        userRepository.save(user);
    }

    private UserResponse mapToResponse(User user) {
        Long apId = user.getAssignedParking() != null ? user.getAssignedParking().getId() : null;
        String apName = user.getAssignedParking() != null ? user.getAssignedParking().getName() : null;
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .assignedParkingId(apId)
                .assignedParkingName(apName)
                .defaultVehiclePlate(user.getDefaultVehiclePlate())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
