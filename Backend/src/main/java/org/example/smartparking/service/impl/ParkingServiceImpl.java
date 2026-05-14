package org.example.smartparking.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.smartparking.config.CacheConfig;
import org.example.smartparking.dto.request.ParkingRequest;
import org.example.smartparking.dto.request.ParkingRatingRequest;
import org.example.smartparking.dto.response.ParkingResponse;
import org.example.smartparking.dto.response.ParkingReviewResponse;
import org.example.smartparking.entity.Parking;
import org.example.smartparking.entity.PricingTier;
import org.example.smartparking.entity.SlotStatus;
import org.example.smartparking.entity.ParkingReview;
import org.example.smartparking.exception.ResourceNotFoundException;
import org.example.smartparking.exception.BadRequestException;
import org.example.smartparking.repository.ParkingRepository;
import org.example.smartparking.repository.ParkingReviewRepository;
import org.example.smartparking.repository.ParkingSlotRepository;
import org.example.smartparking.repository.UserRepository;
import org.example.smartparking.service.ParkingGuardResponseHelper;
import org.example.smartparking.service.ParkingNameValidator;
import org.example.smartparking.service.ParkingService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;

@Service
@RequiredArgsConstructor
public class ParkingServiceImpl implements ParkingService {

    private final ParkingRepository parkingRepository;
    private final ParkingSlotRepository parkingSlotRepository;
    private final UserRepository userRepository;
    private final ParkingNameValidator parkingNameValidator;
    private final ParkingGuardResponseHelper parkingGuardResponseHelper;
    private final ParkingReviewRepository parkingReviewRepository;

    @Override
    @Transactional
    public ParkingResponse createParking(ParkingRequest request) {
        boolean hasFloors = request.getLayoutFloors() != null;
        boolean hasSpots = request.getLayoutSpotsPerFloor() != null;
        if (hasFloors != hasSpots) {
            throw new BadRequestException("Provide both layoutFloors and layoutSpotsPerFloor, or neither");
        }
        boolean layout = hasFloors;
        int totalSlots;
        if (layout) {
            totalSlots = request.getLayoutFloors() * request.getLayoutSpotsPerFloor();
            if (request.getTotalSlots() != null && !request.getTotalSlots().equals(totalSlots)) {
                throw new BadRequestException("totalSlots must equal layoutFloors × layoutSpotsPerFloor (" + totalSlots + ")");
            }
        } else {
            if (request.getTotalSlots() == null || request.getTotalSlots() < 1) {
                throw new BadRequestException("totalSlots is required and must be positive");
            }
            totalSlots = request.getTotalSlots();
        }
        String name = request.getName().trim();
        parkingNameValidator.assertUniqueName(name, null);
        PricingTier tier = parsePricingTier(request.getPricingTier());
        Parking parking = Parking.builder()
                .name(name)
                .address(request.getAddress())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .totalSlots(totalSlots)
                .pricePerHour(request.getPricePerHour())
                .pricingTier(tier)
                .dailyCapPrice(request.getDailyCapPrice())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .layoutFloors(request.getLayoutFloors())
                .layoutSpotsPerFloor(request.getLayoutSpotsPerFloor())
                .undergroundFloors(request.getUndergroundFloors())
                .active(true)
                .build();

        parking = parkingRepository.save(parking);
        return mapToResponse(parking);
    }

    @Override
    @Transactional
    public ParkingResponse updateParking(Long id, ParkingRequest request) {
        Parking parking = parkingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Parking not found with id: " + id));

        boolean hasFloors = request.getLayoutFloors() != null;
        boolean hasSpots = request.getLayoutSpotsPerFloor() != null;
        int totalSlots;
        if (hasFloors && hasSpots) {
            totalSlots = request.getLayoutFloors() * request.getLayoutSpotsPerFloor();
            if (request.getTotalSlots() != null && !request.getTotalSlots().equals(totalSlots)) {
                throw new BadRequestException("totalSlots must equal layoutFloors × layoutSpotsPerFloor (" + totalSlots + ")");
            }
        } else {
            if (!hasFloors && hasSpots) {
                throw new BadRequestException("layoutSpotsPerFloor requires layoutFloors");
            }
            if (request.getTotalSlots() == null || request.getTotalSlots() < 1) {
                throw new BadRequestException("totalSlots is required and must be positive");
            }
            totalSlots = request.getTotalSlots();
        }
        String name = request.getName().trim();
        parkingNameValidator.assertUniqueName(name, id);
        parking.setName(name);
        parking.setAddress(request.getAddress());
        parking.setDescription(request.getDescription());
        parking.setImageUrl(request.getImageUrl());
        parking.setTotalSlots(totalSlots);
        parking.setPricePerHour(request.getPricePerHour());
        if (request.getPricingTier() != null && !request.getPricingTier().isBlank()) {
            parking.setPricingTier(parsePricingTier(request.getPricingTier()));
        }
        if (request.getDailyCapPrice() != null) {
            parking.setDailyCapPrice(request.getDailyCapPrice());
        }
        parking.setLatitude(request.getLatitude());
        parking.setLongitude(request.getLongitude());
        parking.setLayoutFloors(request.getLayoutFloors());
        parking.setLayoutSpotsPerFloor(request.getLayoutSpotsPerFloor());
        parking.setUndergroundFloors(request.getUndergroundFloors());

        parking = parkingRepository.save(parking);
        return mapToResponse(parking);
    }

    @Override
    @Transactional
    public void deleteParking(Long id) {
        Parking parking = parkingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Parking not found with id: " + id));
        parkingRepository.delete(parking);
    }

    @Override
    @Transactional(readOnly = true)
    public ParkingResponse getParkingById(Long id) {
        Parking parking = parkingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Parking not found with id: " + id));
        return mapToResponse(parking);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ParkingReviewResponse> getParkingReviews(Long parkingId, int limit) {
        // Ensure parking exists (nice 404)
        parkingRepository.findById(parkingId)
                .orElseThrow(() -> new ResourceNotFoundException("Parking not found with id: " + parkingId));
        return parkingReviewRepository.findLatestForParking(parkingId, PageRequest.of(0, limit)).stream()
                .map(this::mapReviewToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = CacheConfig.PARKINGS_ALL, allEntries = true),
            @CacheEvict(value = CacheConfig.PARKINGS_ACTIVE, allEntries = true),
            @CacheEvict(value = CacheConfig.PARKINGS_BY_ID, key = "#parkingId")
    })
    public ParkingResponse rateParking(String userEmail, Long parkingId, ParkingRatingRequest request) {
        if (request == null || request.getRating() == null) {
            throw new BadRequestException("rating is required");
        }
        int rating = request.getRating();
        if (rating < 1 || rating > 5) {
            throw new BadRequestException("rating must be between 1 and 5");
        }

        Parking parking = parkingRepository.findById(parkingId)
                .orElseThrow(() -> new ResourceNotFoundException("Parking not found with id: " + parkingId));
        var user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        Optional<ParkingReview> existing = parkingReviewRepository.findByParkingIdAndUserId(parkingId, user.getId());
        ParkingReview review = existing.orElseGet(() -> ParkingReview.builder()
                .parking(parking)
                .user(user)
                .build());
        review.setRating(rating);
        review.setComment(null);
        parkingReviewRepository.save(review);

        return mapToResponse(parking);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.PARKINGS_ALL)
    public List<ParkingResponse> getAllParkings() {
        return parkingRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.PARKINGS_ACTIVE)
    public List<ParkingResponse> getActiveParkings() {
        return parkingRepository.findByActiveTrue().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.PARKINGS_SEARCH, key = "#name")
    public List<ParkingResponse> searchParkings(String name) {
        return parkingRepository.findByNameContainingIgnoreCase(name).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private ParkingResponse mapToResponse(Parking parking) {
        long availableSlots = parkingSlotRepository.countByParkingIdAndStatus(
                parking.getId(), SlotStatus.AVAILABLE);
        Double avgRating = parkingReviewRepository.getAvgRating(parking.getId());
        long reviewCount = parkingReviewRepository.countByParkingId(parking.getId());

        ParkingResponse.ParkingResponseBuilder b = ParkingResponse.builder()
                .id(parking.getId())
                .name(parking.getName())
                .address(parking.getAddress())
                .description(parking.getDescription())
                .imageUrl(parking.getImageUrl())
                .totalSlots(parking.getTotalSlots())
                .availableSlots(availableSlots)
                .pricePerHour(parking.getPricePerHour())
                .pricingTier(parking.getPricingTier() != null ? parking.getPricingTier().name() : null)
                .dailyCapPrice(parking.getDailyCapPrice())
                .layoutFloors(parking.getLayoutFloors())
                .layoutSpotsPerFloor(parking.getLayoutSpotsPerFloor())
                .undergroundFloors(parking.getUndergroundFloors())
                .avgRating(avgRating != null ? avgRating : 0.0)
                .reviewCount(reviewCount)
                .active(parking.getActive())
                .latitude(parking.getLatitude())
                .longitude(parking.getLongitude())
                .ownerId(parking.getOwner() != null ? parking.getOwner().getId() : null)
                .ownerName(parking.getOwner() != null ? parking.getOwner().getFullName() : null)
                .createdAt(parking.getCreatedAt());

        parkingGuardResponseHelper.applyGuardFields(b, parking.getId());
        return b.build();
    }

    private ParkingReviewResponse mapReviewToResponse(ParkingReview r) {
        return ParkingReviewResponse.builder()
                .id(r.getId())
                .rating(r.getRating())
                .comment(r.getComment())
                .userId(r.getUser() != null ? r.getUser().getId() : null)
                .userFullName(r.getUser() != null ? r.getUser().getFullName() : null)
                .createdAt(r.getCreatedAt())
                .build();
    }

    private static PricingTier parsePricingTier(String raw) {
        if (raw == null || raw.isBlank()) {
            return PricingTier.STANDARD;
        }
        try {
            return PricingTier.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return PricingTier.STANDARD;
        }
    }
}

