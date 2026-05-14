package org.example.smartparking.controller;

import lombok.RequiredArgsConstructor;
import org.example.smartparking.dto.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@RestController
@RequestMapping("/api/navigation")
@RequiredArgsConstructor
public class NavigationController {

    /**
     * GET /api/navigation/route
     *
     * Fetches a driving route from Mapbox Directions API.
     *
     * Parameters:
     * - userLat, userLng: User's current location
     * - parkingLat, parkingLng: Destination parking location
     *
     * Returns route coordinates, steps, distance, and duration.
     */
    @GetMapping("/route")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRoute(
            @RequestParam Double userLat,
            @RequestParam Double userLng,
            @RequestParam Double parkingLat,
            @RequestParam Double parkingLng
    ) {
        try {
            String mapboxToken = System.getenv("MAPBOX_TOKEN");
            if (mapboxToken == null || mapboxToken.isEmpty()) {
                mapboxToken = "pk.placeholder";
            }

            String url = String.format(
                    "https://api.mapbox.com/directions/v5/mapbox/driving/%f,%f;%f,%f?geometries=geojson&overview=full&steps=true&banner_instructions=true&annotations=distance,duration,speed&access_token=%s",
                    userLng, userLat, parkingLng, parkingLat, mapboxToken
            );

            RestTemplate restTemplate = new RestTemplate();
            @SuppressWarnings("unchecked")
            Map<String, Object> mapboxResponse = restTemplate.getForObject(url, Map.class);

            if (mapboxResponse == null || !mapboxResponse.containsKey("routes")) {
                return ResponseEntity.ok(ApiResponse.error("No route found"));
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> routes = (List<Map<String, Object>>) mapboxResponse.get("routes");
            if (routes.isEmpty()) {
                return ResponseEntity.ok(ApiResponse.error("No route found"));
            }

            Map<String, Object> route = routes.get(0);
            double distanceMeters = ((Number) route.get("distance")).doubleValue();
            double durationSeconds = ((Number) route.get("duration")).doubleValue();

            @SuppressWarnings("unchecked")
            Map<String, Object> geometry = (Map<String, Object>) route.get("geometry");
            @SuppressWarnings("unchecked")
            List<List<Double>> coordinates = (List<List<Double>>) geometry.get("coordinates");

            // Build route points as {lat, lng} list
            List<Map<String, Double>> routePoints = new ArrayList<>();
            for (List<Double> coord : coordinates) {
                Map<String, Double> point = new HashMap<>();
                point.put("lng", coord.get(0));
                point.put("lat", coord.get(1));
                routePoints.add(point);
            }

            // Parse steps from legs
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> legs = (List<Map<String, Object>>) route.get("legs");
            List<Map<String, Object>> steps = new ArrayList<>();
            if (legs != null) {
                for (Map<String, Object> leg : legs) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> legSteps = (List<Map<String, Object>>) leg.get("steps");
                    if (legSteps != null) {
                        for (Map<String, Object> step : legSteps) {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> maneuver = (Map<String, Object>) step.get("maneuver");
                            Map<String, Object> stepData = new HashMap<>();
                            if (maneuver != null) {
                                stepData.put("instruction", maneuver.getOrDefault("instruction", ""));
                                stepData.put("type", maneuver.getOrDefault("type", ""));
                                stepData.put("modifier", maneuver.getOrDefault("modifier", ""));
                                stepData.put("location", maneuver.get("location"));
                            }
                            stepData.put("distance", step.getOrDefault("distance", 0));
                            stepData.put("duration", step.getOrDefault("duration", 0));
                            steps.add(stepData);
                        }
                    }
                }
            }

            // Format distance and duration
            String distanceText = distanceMeters < 1000
                    ? String.format("%.0f m", distanceMeters)
                    : String.format("%.1f km", distanceMeters / 1000);

            String durationText = durationSeconds < 60
                    ? String.format("%.0f sec", durationSeconds)
                    : String.format("%.0f min", durationSeconds / 60);

            Map<String, Object> result = new HashMap<>();
            result.put("route", routePoints);
            result.put("geometry", geometry);
            result.put("steps", steps);
            result.put("distance", distanceText);
            result.put("duration", durationText);
            result.put("distanceMeters", distanceMeters);
            result.put("durationSeconds", durationSeconds);

            return ResponseEntity.ok(ApiResponse.success("Route calculated successfully", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(ApiResponse.error("Failed to calculate route: " + e.getMessage()));
        }
    }
}

