package org.example.smartparking.service;

import org.example.smartparking.dto.request.ParkingRequest;
import org.example.smartparking.dto.request.ParkingRatingRequest;
import org.example.smartparking.dto.response.ParkingResponse;
import org.example.smartparking.dto.response.ParkingReviewResponse;

import java.util.List;

public interface ParkingService {
    ParkingResponse createParking(ParkingRequest request);
    ParkingResponse updateParking(Long id, ParkingRequest request);
    void deleteParking(Long id);
    ParkingResponse getParkingById(Long id);
    List<ParkingReviewResponse> getParkingReviews(Long parkingId, int limit);
    ParkingResponse rateParking(String userEmail, Long parkingId, ParkingRatingRequest request);
    List<ParkingResponse> getAllParkings();
    List<ParkingResponse> getActiveParkings();
    List<ParkingResponse> searchParkings(String name);
}

