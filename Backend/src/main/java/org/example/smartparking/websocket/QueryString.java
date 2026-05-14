package org.example.smartparking.websocket;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

final class QueryString {
    private QueryString() {}

    static String get(String query, String key) {
        if (query == null || query.isBlank()) return null;
        String[] parts = query.split("&");
        for (String p : parts) {
            int idx = p.indexOf('=');
            if (idx <= 0) continue;
            String k = decode(p.substring(0, idx));
            if (!key.equals(k)) continue;
            return decode(p.substring(idx + 1));
        }
        return null;
    }

    private static String decode(String v) {
        return URLDecoder.decode(v, StandardCharsets.UTF_8);
    }
}

