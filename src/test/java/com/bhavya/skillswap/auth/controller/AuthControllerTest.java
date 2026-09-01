package com.bhavya.skillswap.auth.controller;

import com.bhavya.skillswap.auth.dto.AuthResponse;
import com.bhavya.skillswap.auth.dto.LoginRequest;
import com.bhavya.skillswap.auth.dto.RegisterRequest;
import com.bhavya.skillswap.auth.service.AuthService;
import com.bhavya.skillswap.common.exception.EmailAlreadyRegisteredException;
import com.bhavya.skillswap.common.util.JwtUtil;
import com.bhavya.skillswap.filter.JwtAuthFilter;
import com.bhavya.skillswap.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private AuthService authService;
    @MockitoBean
    private JwtAuthFilter jwtAuthFilter;

    @Test
    void register_validRequest_returns201() throws Exception {
        RegisterRequest req = new RegisterRequest("test@example.com", "password123", "Test User");
        AuthResponse res = new AuthResponse("jwt-token", UUID.randomUUID(), "Test User");

        when(authService.register(any())).thenReturn(res);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("jwt-token"));
    }

    @Test
    void register_invalidEmail_returns400() throws Exception {
        RegisterRequest req =
                new RegisterRequest("not-an-email", "password123", "Test User");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());

        verify(authService, never()).register(any());
    }

    @Test
    void register_duplicateEmail_returns409() throws Exception {
        RegisterRequest req = new RegisterRequest("test@example.com", "password123", "Test User");

        when(authService.register(any()))
                .thenThrow(new EmailAlreadyRegisteredException("Email already registered"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict());
    }

    @Test
    void login_validRequest_returns200() throws Exception {
        LoginRequest req = new LoginRequest("test@example.com", "password123");
        AuthResponse res = new AuthResponse("jwt-token", UUID.randomUUID(), "Test User");

        when(authService.login(any())).thenReturn(res);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token"));
    }


}