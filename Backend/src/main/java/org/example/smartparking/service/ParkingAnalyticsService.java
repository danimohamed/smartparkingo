package org.example.smartparking.service;

import org.example.smartparking.dto.request.InternalLiveMetricsRequest;
import org.example.smartparking.dto.response.OwnerParkingAnalyticsLiveResponse;

public interface ParkingAnalyticsService {

    void upsertLiveMetrics(InternalLiveMetricsRequest request);

    OwnerParkingAnalyticsLiveResponse getLiveForOwner(Long ownerUserId, Long parkingId);

    OwnerParkingAnalyticsLiveResponse getLiveForAdmin(Long parkingId);

    void resetLiveMetricsForOwner(Long ownerUserId, Long parkingId);

    org.springframework.core.io.Resource streamSampleVideo(Long ownerUserId, Long parkingId);

    org.springframework.core.io.Resource streamOverlayImage(Long ownerUserId, Long parkingId);

    org.springframework.core.io.Resource streamSampleVideoAdmin(Long parkingId);

    org.springframework.core.io.Resource streamOverlayImageAdmin(Long parkingId);
}
