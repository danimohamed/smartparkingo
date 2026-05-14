package org.example.smartparking.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .exceptionHandling(ex -> ex.authenticationEntryPoint(jwtAuthenticationEntryPoint))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Actuator endpoints
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/actuator/**").hasRole("ADMIN")
                // Public endpoints
                .requestMatchers("/api/auth/login", "/api/auth/register", "/api/auth/oauth-login",
                        "/api/auth/forgot-password", "/api/auth/reset-password",
                        "/api/auth/register-owner").permitAll()
                // Admin registration requires ADMIN role
                .requestMatchers("/api/auth/register-admin").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/parkings/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/parking-slots/parking/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/parking-slots/available/**").permitAll()
                // Admin endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/parkings/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/parkings/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/parkings/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/parking-slots/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/parking-slots/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/parking-slots/**").hasRole("ADMIN")
                // Owner endpoints (admin can view dashboard/earnings/reservations)
                .requestMatchers(HttpMethod.GET, "/api/owner/dashboard").hasAnyRole("PARKING_OWNER", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/owner/earnings").hasAnyRole("PARKING_OWNER", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/owner/reservations").hasAnyRole("PARKING_OWNER", "ADMIN")
                .requestMatchers("/api/owner/**").hasRole("PARKING_OWNER")
                // Guard (QR scan, manual slot ops) — admin allowed for full control
                .requestMatchers("/api/guard/**").hasAnyRole("GUARD", "ADMIN")
                // WebSocket signaling (auth handled in handshake interceptor via token query param)
                .requestMatchers("/ws/**").permitAll()
                // All other endpoints require authentication
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000",
            "https://parkingo.app",
            "https://www.parkingo.app",
            "https://smartparking-web-eu-ca1236d7d681.herokuapp.com"
        ));
        configuration.setAllowCredentials(true);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With"));
        configuration.setExposedHeaders(List.of("Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

