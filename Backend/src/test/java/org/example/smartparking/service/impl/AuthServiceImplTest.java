package org.example.smartparking.service.impl;

import org.example.smartparking.dto.request.LoginRequest;
import org.example.smartparking.dto.request.RegisterRequest;
import org.example.smartparking.dto.response.AuthResponse;
import org.example.smartparking.entity.Role;
import org.example.smartparking.entity.User;
import org.example.smartparking.exception.BadRequestException;
import org.example.smartparking.repository.UserRepository;
import org.example.smartparking.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private AuthServiceImpl authService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private User savedUser;
    private Authentication authentication;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest();
        registerRequest.setFullName("Mohamed Dani");
        registerRequest.setEmail("dani@example.com");
        registerRequest.setPassword("password123");
        registerRequest.setPhone("+212600000000");

        loginRequest = new LoginRequest();
        loginRequest.setEmail("dani@example.com");
        loginRequest.setPassword("password123");

        savedUser = User.builder()
                .id(1L)
                .fullName("Mohamed Dani")
                .email("dani@example.com")
                .password("$2a$10$encodedPassword")
                .phone("+212600000000")
                .role(Role.USER)
                .build();

        authentication = mock(Authentication.class);
    }

    @Nested
    @DisplayName("register()")
    class RegisterTests {

        @Test
        @DisplayName("Should register new user successfully")
        void shouldRegisterUser() {
            when(userRepository.existsByEmail("dani@example.com")).thenReturn(false);
            when(passwordEncoder.encode("password123")).thenReturn("$2a$10$encodedPassword");
            when(userRepository.save(any(User.class))).thenReturn(savedUser);
            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                    .thenReturn(authentication);
            when(jwtTokenProvider.generateToken(authentication)).thenReturn("jwt-token-123");

            AuthResponse result = authService.register(registerRequest);

            assertThat(result).isNotNull();
            assertThat(result.getToken()).isEqualTo("jwt-token-123");
            assertThat(result.getType()).isEqualTo("Bearer");
            assertThat(result.getEmail()).isEqualTo("dani@example.com");
            assertThat(result.getFullName()).isEqualTo("Mohamed Dani");
            assertThat(result.getRole()).isEqualTo("USER");
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw BadRequestException when email already exists")
        void shouldThrowWhenEmailExists() {
            when(userRepository.existsByEmail("dani@example.com")).thenReturn(true);

            assertThatThrownBy(() -> authService.register(registerRequest))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Email already in use");

            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should encode password before saving")
        void shouldEncodePassword() {
            when(userRepository.existsByEmail(anyString())).thenReturn(false);
            when(passwordEncoder.encode("password123")).thenReturn("$2a$10$encodedPassword");
            when(userRepository.save(any(User.class))).thenReturn(savedUser);
            when(authenticationManager.authenticate(any())).thenReturn(authentication);
            when(jwtTokenProvider.generateToken(any())).thenReturn("token");

            authService.register(registerRequest);

            verify(passwordEncoder).encode("password123");
        }
    }

    @Nested
    @DisplayName("registerAdmin()")
    class RegisterAdminTests {

        @Test
        @DisplayName("Should register admin with ADMIN role")
        void shouldRegisterAdmin() {
            User adminUser = User.builder()
                    .id(2L)
                    .fullName("Mohamed Dani")
                    .email("dani@example.com")
                    .password("$2a$10$encodedPassword")
                    .role(Role.ADMIN)
                    .build();

            when(userRepository.existsByEmail("dani@example.com")).thenReturn(false);
            when(passwordEncoder.encode("password123")).thenReturn("$2a$10$encodedPassword");
            when(userRepository.save(any(User.class))).thenReturn(adminUser);
            when(authenticationManager.authenticate(any())).thenReturn(authentication);
            when(jwtTokenProvider.generateToken(any())).thenReturn("admin-token");

            AuthResponse result = authService.registerAdmin(registerRequest);

            assertThat(result.getRole()).isEqualTo("ADMIN");
            assertThat(result.getToken()).isEqualTo("admin-token");
        }
    }

    @Nested
    @DisplayName("login()")
    class LoginTests {

        @Test
        @DisplayName("Should login successfully with valid credentials")
        void shouldLoginSuccessfully() {
            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                    .thenReturn(authentication);
            when(jwtTokenProvider.generateToken(authentication)).thenReturn("login-jwt-token");
            when(userRepository.findByEmail("dani@example.com")).thenReturn(Optional.of(savedUser));

            AuthResponse result = authService.login(loginRequest);

            assertThat(result).isNotNull();
            assertThat(result.getToken()).isEqualTo("login-jwt-token");
            assertThat(result.getType()).isEqualTo("Bearer");
            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getEmail()).isEqualTo("dani@example.com");
            assertThat(result.getRole()).isEqualTo("USER");
        }

        @Test
        @DisplayName("Should throw when authentication fails (bad credentials)")
        void shouldThrowOnBadCredentials() {
            when(authenticationManager.authenticate(any()))
                    .thenThrow(new BadCredentialsException("Bad credentials"));

            assertThatThrownBy(() -> authService.login(loginRequest))
                    .isInstanceOf(BadCredentialsException.class);
        }

        @Test
        @DisplayName("Should throw BadRequestException when user not found after auth")
        void shouldThrowWhenUserNotFoundAfterAuth() {
            when(authenticationManager.authenticate(any())).thenReturn(authentication);
            when(jwtTokenProvider.generateToken(any())).thenReturn("token");
            when(userRepository.findByEmail("dani@example.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.login(loginRequest))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("User not found");
        }
    }
}

