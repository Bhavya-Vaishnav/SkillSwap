package com.bhavya.skillswap.session.controller;

import com.bhavya.skillswap.common.util.JwtUtil;
import com.bhavya.skillswap.session.dto.AcceptSessionRequest;
import com.bhavya.skillswap.session.dto.PriceSuggestionResponse;
import com.bhavya.skillswap.session.dto.SessionRequest;
import com.bhavya.skillswap.session.dto.SessionResponse;
import com.bhavya.skillswap.session.entity.SessionStatus;
import com.bhavya.skillswap.session.service.SessionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SessionController.class)
@AutoConfigureMockMvc(addFilters = false)
class SessionControllerTest {

    @Autowired
    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private SessionService sessionService;
    @MockitoBean
    private JwtUtil jwtUtil;

    @Test
    void requestSession_valid_returns201() throws Exception {
        var req = new SessionRequest(UUID.randomUUID(), UUID.randomUUID(), new BigDecimal("10.00"));
        var res = new SessionResponse(UUID.randomUUID(), UUID.randomUUID(), "Alice", "alice@test.com",
                req.providerId(), "Bob", "bob@test.com", req.skillId(), req.creditAmount(), SessionStatus.REQUESTED, null);

        when(sessionService.requestSession(any(), any())).thenReturn(res);

        mockMvc.perform(post("/api/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("REQUESTED"));
    }

    @Test
    void acceptSession_returns200() throws Exception {
        UUID sessionId = UUID.randomUUID();
        var res = new SessionResponse(sessionId, UUID.randomUUID(), "Alice", "alice@test.com",
                UUID.randomUUID(), "Bob", "bob@test.com", UUID.randomUUID(), new BigDecimal("10.00"), SessionStatus.ACCEPTED,
                "https://meet.google.com/abc-defg-hij");

        when(sessionService.acceptSession(any(), any(), any())).thenReturn(res);

        var req = new AcceptSessionRequest("https://meet.google.com/abc-defg-hij");

        mockMvc.perform(post("/api/sessions/" + sessionId + "/accept")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"))
                .andExpect(jsonPath("$.meetingLink").value("https://meet.google.com/abc-defg-hij"));
    }

    @Test
    void completeSession_returns200() throws Exception {
        UUID sessionId = UUID.randomUUID();
        var res = new SessionResponse(sessionId, UUID.randomUUID(), "Alice", "alice@test.com",
                UUID.randomUUID(), "Bob", "bob@test.com", UUID.randomUUID(), new BigDecimal("10.00"),
                SessionStatus.COMPLETED, "https://meet.google.com/abc-defg-hij");

        when(sessionService.completeSession(any(), any())).thenReturn(res);

        mockMvc.perform(post("/api/sessions/" + sessionId + "/complete"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));
    }

    @Test
    void suggestPrice_returnsSuggestion() throws Exception {
        var response = new PriceSuggestionResponse(
                "Python",
                true,
                new BigDecimal("10.00"),
                new BigDecimal("8.00"),
                new BigDecimal("15.00"),
                5L,
                "Average is 10 credits based on 5 completed sessions."
        );
        when(sessionService.suggestPrice("Python")).thenReturn(response);

        mockMvc.perform(get("/api/sessions/suggest-price").param("skillName", "Python"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Average is 10 credits based on 5 completed sessions."));
    }
}