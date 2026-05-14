package org.example.smartparking.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.smartparking.dto.request.InternalLiveMetricsRequest;
import org.example.smartparking.dto.response.ApiResponse;
import org.example.smartparking.service.ParkingAnalyticsService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/internal/analytics")
@RequiredArgsConstructor
public class InternalAnalyticsController {

    private final ParkingAnalyticsService parkingAnalyticsService;

    @Value("${app.internal-analytics-token:dev-internal-analytics}")
    private String internalToken;

    @PostMapping("/live-metrics")
    public ResponseEntity<ApiResponse<Void>> postLiveMetrics(
            @RequestHeader(value = "X-Internal-Token", required = false) String token,
            @Valid @RequestBody InternalLiveMetricsRequest body) {
        if (token == null || !token.equals(internalToken)) {
            return ResponseEntity.status(403).body(ApiResponse.error("Invalid internal token"));
        }
        parkingAnalyticsService.upsertLiveMetrics(body);
        return ResponseEntity.ok(ApiResponse.success("OK", null));
    }
}
