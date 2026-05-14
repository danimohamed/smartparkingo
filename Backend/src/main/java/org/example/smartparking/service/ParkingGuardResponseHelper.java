package org.example.smartparking.service;

import lombok.RequiredArgsConstructor;
import org.example.smartparking.dto.response.ParkingGuardSummary;
import org.example.smartparking.dto.response.ParkingResponse;
import org.example.smartparking.entity.ParkingGuard;
import org.example.smartparking.entity.Role;
import org.example.smartparking.entity.User;
import org.example.smartparking.repository.ParkingGuardRepository;
import org.example.smartparking.repository.UserRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class ParkingGuardResponseHelper {

    private final ParkingGuardRepository parkingGuardRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public void applyGuardFields(ParkingResponse.ParkingResponseBuilder builder, Long parkingId) {
        List<ParkingGuardSummary> guardians = buildMergedSummaries(parkingId);
        builder.guardians(guardians);
        User first = null;
        if (!guardians.isEmpty()) {
            first = userRepository.findById(guardians.get(0).getId()).orElse(null);
        } else {
            first = userRepository.findFirstByRoleAndAssignedParking_Id(Role.GUARD, parkingId).orElse(null);
        }
        builder.guardId(first != null ? first.getId() : null)
                .guardName(first != null ? first.getFullName() : null)
                .guardPhone(first != null ? first.getPhone() : null);
    }

    private List<ParkingGuardSummary> buildMergedSummaries(Long parkingId) {
        Map<Long, ParkingGuardSummary> byId = new LinkedHashMap<>();
        for (ParkingGuard pg : parkingGuardRepository.findByParking_IdOrderByIdAsc(parkingId)) {
            User u = pg.getUser();
            byId.putIfAbsent(u.getId(), toSummary(u));
        }
        userRepository.findFirstByRoleAndAssignedParking_Id(Role.GUARD, parkingId)
                .ifPresent(u -> byId.putIfAbsent(u.getId(), toSummary(u)));
        return new ArrayList<>(byId.values());
    }

    private static ParkingGuardSummary toSummary(User u) {
        return ParkingGuardSummary.builder()
                .id(u.getId())
                .fullName(u.getFullName())
                .email(u.getEmail())
                .build();
    }
}
