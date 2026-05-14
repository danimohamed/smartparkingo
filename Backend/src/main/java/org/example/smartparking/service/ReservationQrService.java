package org.example.smartparking.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.example.smartparking.entity.Reservation;
import org.example.smartparking.security.JwtTokenProvider;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Signs and verifies reservation QR payloads (HMAC-SHA256).
 * Content: reservation id, user, slot, parking, validity window (start-15m .. end+15m).
 */
@Service
@RequiredArgsConstructor
public class ReservationQrService {

    private static final String HMAC_ALG = "HmacSHA256";
    private static final int ENTRY_GRACE_MINUTES = 15;

    private final JwtTokenProvider jwtTokenProvider;
    private final ObjectMapper objectMapper;

    public String buildQrToken(Reservation r) {
        LocalDateTime vf = r.getStartTime().minusMinutes(ENTRY_GRACE_MINUTES);
        LocalDateTime vu = r.getEndTime().plusMinutes(ENTRY_GRACE_MINUTES);
        long parkingId = r.getParkingSlot().getParking().getId();
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("rid", r.getId());
        payload.put("uid", r.getUser().getId());
        payload.put("sid", r.getParkingSlot().getId());
        payload.put("pid", parkingId);
        payload.put("vf", vf.toString());
        payload.put("vu", vu.toString());
        try {
            String json = objectMapper.writeValueAsString(payload);
            byte[] sig = hmac(json.getBytes(StandardCharsets.UTF_8));
            String b64Json = Base64.getUrlEncoder().withoutPadding().encodeToString(json.getBytes(StandardCharsets.UTF_8));
            String b64Sig = Base64.getUrlEncoder().withoutPadding().encodeToString(sig);
            return b64Json + "." + b64Sig;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to build QR token", e);
        }
    }

    public QrPayload verifyAndParse(String qrToken) {
        if (qrToken == null || !qrToken.contains(".")) {
            throw new IllegalArgumentException("Invalid QR format");
        }
        int dot = qrToken.indexOf('.');
        String b64Json = qrToken.substring(0, dot);
        String b64Sig = qrToken.substring(dot + 1);
        byte[] jsonBytes = Base64.getUrlDecoder().decode(b64Json);
        byte[] sig = Base64.getUrlDecoder().decode(b64Sig);
        String json = new String(jsonBytes, StandardCharsets.UTF_8);
        byte[] expected = hmac(json.getBytes(StandardCharsets.UTF_8));
        if (!constantTimeEquals(sig, expected)) {
            throw new IllegalArgumentException("Invalid QR signature");
        }
        try {
            JsonNode node = objectMapper.readTree(json);
            return new QrPayload(
                    node.get("rid").asLong(),
                    node.get("uid").asLong(),
                    node.get("sid").asLong(),
                    node.get("pid").asLong(),
                    LocalDateTime.parse(node.get("vf").asText()),
                    LocalDateTime.parse(node.get("vu").asText())
            );
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid QR payload", e);
        }
    }

    private byte[] hmac(byte[] data) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALG);
            mac.init(jwtTokenProvider.getHmacSigningKey());
            return mac.doFinal(data);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("HMAC failed", e);
        }
    }

    private static boolean constantTimeEquals(byte[] a, byte[] b) {
        if (a.length != b.length) {
            return false;
        }
        int r = 0;
        for (int i = 0; i < a.length; i++) {
            r |= a[i] ^ b[i];
        }
        return r == 0;
    }

    public record QrPayload(long reservationId, long userId, long slotId, long parkingId,
                            LocalDateTime validFrom, LocalDateTime validUntil) {}
}
