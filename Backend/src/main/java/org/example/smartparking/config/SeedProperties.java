package org.example.smartparking.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Passwords for dev/demo accounts created or reset by {@link DataSeeder}.
 * Values come from {@code application.properties} (see {@code app.seed.*-password}).
 */
@ConfigurationProperties(prefix = "app.seed")
@Data
public class SeedProperties {
    private String adminPassword;
    private String demoUserPassword;
    private String ownerPassword;
    private String guardPassword;
}
