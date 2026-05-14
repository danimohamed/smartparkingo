package org.example.smartparking.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * In-memory Caffeine cache to reduce database query volume in production.
 *
 * This is especially important on hosted MySQL plans that rate-limit queries.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    public static final String PARKINGS_ALL = "parkings:all";
    public static final String PARKINGS_ACTIVE = "parkings:active";
    public static final String PARKINGS_BY_ID = "parkings:byId";
    public static final String PARKINGS_SEARCH = "parkings:search";
    public static final String SLOTS_BY_PARKING = "slots:byParking";
    public static final String SLOTS_AVAILABLE_BY_PARKING = "slots:availableByParking";

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager mgr = new CaffeineCacheManager(
                PARKINGS_ALL,
                PARKINGS_ACTIVE,
                PARKINGS_BY_ID,
                PARKINGS_SEARCH,
                SLOTS_BY_PARKING,
                SLOTS_AVAILABLE_BY_PARKING
        );
        mgr.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(30, TimeUnit.SECONDS)
                .maximumSize(5_000));
        return mgr;
    }
}

