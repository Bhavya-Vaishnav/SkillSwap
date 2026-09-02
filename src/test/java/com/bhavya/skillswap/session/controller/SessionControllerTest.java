package com.bhavya.skillswap.session.controller;

import com.bhavya.skillswap.common.util.JwtUtil;
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
        var res = new SessionResponse(UUID.randomUUID(), UUID.randomUUID(), req.providerId(),
                req.skillId(), req.creditAmount(), SessionStatus.REQUESTED);

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
        var res = new SessionResponse(sessionId, UUID.randomUUID(), UUID.randomUUID(),
                UUID.randomUUID(), new BigDecimal("10.00"), SessionStatus.ACCEPTED);

        when(sessionService.acceptSession(any(), any())).thenReturn(res);

        mockMvc.perform(post("/api/sessions/" + sessionId + "/accept"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"));
    }

    @Test
    void completeSession_returns200() throws Exception {
        UUID sessionId = UUID.randomUUID();
        var res = new SessionResponse(sessionId, UUID.randomUUID(), UUID.randomUUID(),
                UUID.randomUUID(), new BigDecimal("10.00"), SessionStatus.COMPLETED);

        when(sessionService.completeSession(any(), any())).thenReturn(res);

        mockMvc.perform(post("/api/sessions/" + sessionId + "/complete"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));
    }
}