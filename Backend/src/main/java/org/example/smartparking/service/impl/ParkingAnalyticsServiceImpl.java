package org.example.smartparking.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.example.smartparking.dto.request.InternalLiveMetricsRequest;
import org.example.smartparking.dto.response.OwnerParkingAnalyticsLiveResponse;
import org.example.smartparking.entity.Parking;
import org.example.smartparking.entity.ParkingAnalyticsConfig;
import org.example.smartparking.entity.ParkingLiveMetrics;
import org.example.smartparking.exception.BadRequestException;
import org.example.smartparking.exception.ResourceNotFoundException;
import org.example.smartparking.repository.ParkingAnalyticsConfigRepository;
import org.example.smartparking.repository.ParkingLiveMetricsRepository;
import org.example.smartparking.repository.ParkingRepository;
import org.example.smartparking.service.ParkingAnalyticsService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
@RequiredArgsConstructor
public class ParkingAnalyticsServiceImpl implements ParkingAnalyticsService {

    /** Demo lot (parking id=1): prefer newest labeled-line clip; fall back if file missing. */
    private static final String[] JEMAA_FALLBACK_VIDEOS = {"camera-entry:exit.mp4", "cctv-exit:enter.mp4"};

    private final ParkingRepository parkingRepository;
    private final ParkingAnalyticsConfigRepository configRepository;
    private final ParkingLiveMetricsRepository liveMetricsRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.analytics.repo-root:}")
    private String repoRootOverride;

    private Path repoRoot() {
        if (repoRootOverride != null && !repoRootOverride.isBlank()) {
            return Paths.get(repoRootOverride).normalize();
        }
        Path cwd = Paths.get("").toAbsolutePath().normalize();
        if (cwd.getFileName() != null && "Backend".equalsIgnoreCase(cwd.getFileName().toString())) {
            return cwd.getParent();
        }
        return cwd;
    }

    private Path sampleVideosDir() {
        return repoRoot().resolve("owner-analytics").resolve("sample-videos");
    }

    private Path resolveSampleVideoFile(Long parkingId, ParkingAnalyticsConfig cfg) {
        Path configured = sampleVideosDir().resolve(cfg.getSampleVideoFilename());
        if (Files.isRegularFile(configured)) {
            return configured;
        }

        // Backward-compatible fallback for the demo parking (ID=1) so the UI doesn't keep showing old/missing demo videos.
        // If the DB config is outdated but the new file exists, serve it.
        if (parkingId != null && parkingId == 1L) {
            for (String name : JEMAA_FALLBACK_VIDEOS) {
                Path jemaa = sampleVideosDir().resolve(name);
                if (Files.isRegularFile(jemaa)) {
                    return jemaa;
                }
            }
        }

        return configured;
    }

    private Path outputDir() {
        return repoRoot().resolve("owner-analytics").resolve("output");
    }

    @Override
    @Transactional
    public void upsertLiveMetrics(InternalLiveMetricsRequest request) {
        Parking parking = parkingRepository.findById(request.getParkingId())
                .orElseThrow(() -> new ResourceNotFoundException("Parking not found"));

        ParkingLiveMetrics metrics = liveMetricsRepository.findById(parking.getId())
                .orElseGet(() -> {
                    // @MapsId: set only the owning side; do not use Lombok @Builder here — it can leave
                    // parkingId unsynchronized and trigger Hibernate "null identifier" on persist.
                    ParkingLiveMetrics created = new ParkingLiveMetrics();
                    created.setParking(parking);
                    return created;
                });

        metrics.setCarsInFrame(request.getCarsInFrame());
        metrics.setEnteredCount(request.getEnteredCount());
        metrics.setExitedCount(request.getExitedCount());
        liveMetricsRepository.save(metrics);
    }

    @Override
    @Transactional(readOnly = true)
    public OwnerParkingAnalyticsLiveResponse getLiveForAdmin(Long parkingId) {
        Parking parking = parkingRepository.findById(parkingId)
                .orElseThrow(() -> new ResourceNotFoundException("Parking not found"));
        return buildLiveResponse(parking);
    }

    @Override
    @Transactional(readOnly = true)
    public OwnerParkingAnalyticsLiveResponse getLiveForOwner(Long ownerUserId, Long parkingId) {
        Parking parking = assertOwnerParking(ownerUserId, parkingId);
        return buildLiveResponse(parking);
    }

    @Override
    @Transactional
    public void resetLiveMetricsForOwner(Long ownerUserId, Long parkingId) {
        Parking parking = assertOwnerParking(ownerUserId, parkingId);
        ParkingLiveMetrics metrics = liveMetricsRepository.findById(parking.getId())
                .orElseGet(() -> {
                    ParkingLiveMetrics created = new ParkingLiveMetrics();
                    created.setParking(parking);
                    return created;
                });
        metrics.setCarsInFrame(0);
        metrics.setEnteredCount(0);
        metrics.setExitedCount(0);
        liveMetricsRepository.save(metrics);
    }

    private int monitoredSlotCount(String slotRegionsJson) {
        if (slotRegionsJson == null || slotRegionsJson.isBlank()) {
            return 0;
        }
        try {
            JsonNode root = objectMapper.readTree(slotRegionsJson);
            return root.isArray() ? root.size() : 0;
        } catch (Exception ignored) {
            return 0;
        }
    }

    private OwnerParkingAnalyticsLiveResponse buildLiveResponse(Parking parking) {
        Long parkingId = parking.getId();
        ParkingAnalyticsConfig cfg = configRepository.findById(parkingId)
                .orElseThrow(() -> new ResourceNotFoundException("Analytics not configured for this parking"));

        ParkingLiveMetrics m = liveMetricsRepository.findById(parkingId).orElse(null);
        int cars = m != null ? m.getCarsInFrame() : 0;
        int lotCap = parking.getTotalSlots() != null ? parking.getTotalSlots() : 0;
        int entered = m != null ? m.getEnteredCount() : 0;
        int exited = m != null ? m.getExitedCount() : 0;

        return OwnerParkingAnalyticsLiveResponse.builder()
                .parkingId(parking.getId())
                .parkingName(parking.getName())
                .sampleVideoFilename(cfg.getSampleVideoFilename())
                .parkingLotCapacity(lotCap)
                .slotRegionsJson(cfg.getSlotRegionsJson())
                .carsInFrame(cars)
                .enteredCount(entered)
                .exitedCount(exited)
                .updatedAt(m != null ? m.getUpdatedAt() : null)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Resource streamSampleVideo(Long ownerUserId, Long parkingId) {
        Parking parking = assertOwnerParking(ownerUserId, parkingId);
        ParkingAnalyticsConfig cfg = configRepository.findById(parkingId)
                .orElseThrow(() -> new ResourceNotFoundException("Analytics not configured for this parking"));
        Path file = resolveSampleVideoFile(parkingId, cfg);
        if (!Files.isRegularFile(file)) {
            throw new ResourceNotFoundException("Sample video not found: " + file);
        }
        return new FileSystemResource(file);
    }

    @Override
    @Transactional(readOnly = true)
    public Resource streamSampleVideoAdmin(Long parkingId) {
        parkingRepository.findById(parkingId)
                .orElseThrow(() -> new ResourceNotFoundException("Parking not found"));
        ParkingAnalyticsConfig cfg = configRepository.findById(parkingId)
                .orElseThrow(() -> new ResourceNotFoundException("Analytics not configured for this parking"));
        Path file = resolveSampleVideoFile(parkingId, cfg);
        if (!Files.isRegularFile(file)) {
            throw new ResourceNotFoundException("Sample video not found: " + file);
        }
        return new FileSystemResource(file);
    }

    @Override
    @Transactional(readOnly = true)
    public Resource streamOverlayImage(Long ownerUserId, Long parkingId) {
        assertOwnerParking(ownerUserId, parkingId);
        Path file = outputDir().resolve(parkingId + ".jpg");
        if (!Files.isRegularFile(file)) {
            throw new ResourceNotFoundException("Overlay image not generated yet. Run the analytics worker.");
        }
        return new FileSystemResource(file);
    }

    @Override
    @Transactional(readOnly = true)
    public Resource streamOverlayImageAdmin(Long parkingId) {
        parkingRepository.findById(parkingId)
                .orElseThrow(() -> new ResourceNotFoundException("Parking not found"));
        Path file = outputDir().resolve(parkingId + ".jpg");
        if (!Files.isRegularFile(file)) {
            throw new ResourceNotFoundException("Overlay image not generated yet. Run the analytics worker.");
        }
        return new FileSystemResource(file);
    }

    private Parking assertOwnerParking(Long ownerUserId, Long parkingId) {
        Parking parking = parkingRepository.findById(parkingId)
                .orElseThrow(() -> new ResourceNotFoundException("Parking not found"));
        if (parking.getOwner() == null || !ownerUserId.equals(parking.getOwner().getId())) {
            throw new BadRequestException("You do not own this parking");
        }
        return parking;
    }
}
