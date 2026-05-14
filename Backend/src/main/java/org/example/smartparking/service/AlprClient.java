package org.example.smartparking.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Optional HTTP client to a plate-reading service.
 *
 * Supported:
 * - Local guard-alpr service (configure {@code app.alpr.url}, e.g. http://127.0.0.1:8790)
 * - Plate Recognizer cloud API (configure {@code app.alpr.plate-recognizer.token})
 */
@Component
@Slf4j
public class AlprClient {

    @Value("${app.alpr.url:}")
    private String baseUrl;

    @Value("${app.alpr.plate-recognizer.token:}")
    private String plateRecognizerToken;

    /**
     * Shared, pre-configured RestTemplate so a slow/dead ALPR endpoint cannot
     * hang the guard scan request indefinitely. Connect = 6s, read = 12s.
     */
    private final RestTemplate http = buildHttp();

    private static RestTemplate buildHttp() {
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(6_000);
        f.setReadTimeout(12_000);
        return new RestTemplate(f);
    }

    /**
     * POST multipart file field {@code file} to {@code /read-plate} and parse JSON {@code plate}, {@code confidence}.
     */
    public Optional<PlateRead> readPlate(byte[] imageBytes, String filename) {
        if (imageBytes == null || imageBytes.length == 0) {
            return Optional.empty();
        }
        if (baseUrl != null && !baseUrl.isBlank()) {
            return readViaLocalService(imageBytes, filename);
        }
        String token = configuredPlateRecognizerToken();
        if (token != null && !token.isBlank()) {
            return readViaPlateRecognizer(imageBytes, filename);
        }
        return Optional.empty();
    }

    public boolean isConfigured() {
        return (baseUrl != null && !baseUrl.isBlank())
                || (configuredPlateRecognizerToken() != null && !configuredPlateRecognizerToken().isBlank());
    }

    public record PlateRead(String plate, double confidence) {
    }

    private Optional<PlateRead> readViaLocalService(byte[] imageBytes, String filename) {
        try {
            String url = baseUrl.endsWith("/") ? baseUrl + "read-plate" : baseUrl + "/read-plate";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            ByteArrayResource resource = new ByteArrayResource(imageBytes) {
                @Override
                public String getFilename() {
                    return filename != null ? filename : "plate.jpg";
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", resource);

            HttpEntity<MultiValueMap<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> resp = http.postForEntity(url, entity, Map.class);
            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
                return Optional.empty();
            }
            Map<?, ?> m = resp.getBody();
            Object p = m.get("plate");
            if (p == null) {
                return Optional.empty();
            }
            double conf = 0.0;
            Object c = m.get("confidence");
            if (c instanceof Number n) {
                conf = n.doubleValue();
            }
            return Optional.of(new PlateRead(p.toString(), conf));
        } catch (Exception e) {
            log.warn("ALPR local service call failed: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Plate Recognizer API: https://platerecognizer.com/
     * POST multipart field "upload" to /v1/plate-reader/
     */
    @SuppressWarnings("unchecked")
    private Optional<PlateRead> readViaPlateRecognizer(byte[] imageBytes, String filename) {
        try {
            String url = "https://api.platerecognizer.com/v1/plate-reader/";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.set("Authorization", "Token " + configuredPlateRecognizerToken().trim());

            ByteArrayResource resource = new ByteArrayResource(imageBytes) {
                @Override
                public String getFilename() {
                    return filename != null ? filename : "plate.jpg";
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("upload", resource);

            HttpEntity<MultiValueMap<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> resp = http.postForEntity(url, entity, Map.class);
            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
                return Optional.empty();
            }
            Map<String, Object> m = resp.getBody();
            Object resultsObj = m.get("results");
            if (!(resultsObj instanceof List<?> results) || results.isEmpty()) {
                return Optional.empty();
            }
            Object firstObj = results.get(0);
            if (!(firstObj instanceof Map<?, ?> first)) {
                return Optional.empty();
            }
            Object plateObj = first.get("plate");
            if (plateObj == null) {
                return Optional.empty();
            }
            double conf = 0.0;
            Object scoreObj = first.get("score");
            if (scoreObj instanceof Number n) {
                conf = n.doubleValue();
            }
            return Optional.of(new PlateRead(plateObj.toString(), conf));
        } catch (Exception e) {
            log.warn("Plate Recognizer call failed: {}", e.getMessage());
            return Optional.empty();
        }
    }

    private String configuredPlateRecognizerToken() {
        if (plateRecognizerToken != null && !plateRecognizerToken.isBlank()) {
            return plateRecognizerToken;
        }
        return readTokenFromLocalEnv().orElse("");
    }

    private Optional<String> readTokenFromLocalEnv() {
        for (Path path : List.of(Path.of(".env.local"), Path.of("Backend", ".env.local"))) {
            if (!Files.isRegularFile(path)) {
                continue;
            }
            try {
                for (String line : Files.readAllLines(path)) {
                    String trimmed = line.trim();
                    if (trimmed.startsWith("PLATE_RECOGNIZER_TOKEN=")) {
                        String token = trimmed.substring("PLATE_RECOGNIZER_TOKEN=".length()).trim();
                        if (!token.isBlank()) {
                            return Optional.of(token);
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Could not read local ALPR env file {}: {}", path, e.getMessage());
            }
        }
        return Optional.empty();
    }
}
