package com.bhavya.skillswap.auth.service;

import com.bhavya.skillswap.auth.dto.AuthResponse;
import com.bhavya.skillswap.auth.dto.LoginRequest;
import com.bhavya.skillswap.auth.dto.RegisterRequest;
import com.bhavya.skillswap.common.exception.EmailAlreadyRegisteredException;
import com.bhavya.skillswap.common.exception.InvalidCredentialsException;
import com.bhavya.skillswap.common.util.JwtUtil;
import com.bhavya.skillswap.user.entity.User;
import com.bhavya.skillswap.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest("test@example.com", "password123", "Test User");
        loginRequest = new LoginRequest("test@example.com", "password123");
    }

    @Test
    void register_success_returnsAuthResponse() {
        when(userRepository.existsByEmail(registerRequest.email())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed-password");

        User savedUser = new User(registerRequest.email(), "hashed-password", registerRequest.displayName());
        savedUser.setId(UUID.randomUUID());
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtUtil.generateToken(any(), anyString())).thenReturn("fake-jwt-token");

        AuthResponse response = authService.register(registerRequest);

        assertThat(response.token()).isEqualTo("fake-jwt-token");
        assertThat(response.userId()).isEqualTo(savedUser.getId());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_duplicateEmail_throwsException() {
        when(userRepository.existsByEmail(registerRequest.email())).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(EmailAlreadyRegisteredException.class)
                .hasMessageContaining("already registered");

        verify(userRepository, never()).save(any());
    }

    @Test
    void login_success_returnsAuthResponse() {
        User user = new User(loginRequest.email(), "hashed-password", "Test User");
        user.setId(UUID.randomUUID());

        when(userRepository.findByEmail(loginRequest.email())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(loginRequest.password(), user.getPasswordHash())).thenReturn(true);
        when(jwtUtil.generateToken(any(), anyString())).thenReturn("fake-jwt-token");

        AuthResponse response = authService.login(loginRequest);

        assertThat(response.token()).isEqualTo("fake-jwt-token");
    }

    @Test
    void login_wrongPassword_throwsException() {
        User user = new User(loginRequest.email(), "hashed-password", "Test User");
        user.setId(UUID.randomUUID());

        when(userRepository.findByEmail(loginRequest.email())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(loginRequest.password(), user.getPasswordHash())).thenReturn(false);

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void login_emailNotFound_throwsException() {
        when(userRepository.findByEmail(loginRequest.email())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(InvalidCredentialsException.class);
    }
}