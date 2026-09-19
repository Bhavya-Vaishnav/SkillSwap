package com.bhavya.skillswap.user.controller;

import com.bhavya.skillswap.common.util.JwtUtil;
import com.bhavya.skillswap.user.dto.UpdateBioRequest;
import com.bhavya.skillswap.user.dto.UserMatchResponse;
import com.bhavya.skillswap.user.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();
    @MockitoBean
    private JwtUtil jwtUtil;
    @MockitoBean
    private UserService userService;

    @Test
    void updateBio_valid_returns200() throws Exception {
        var req = new UpdateBioRequest("I love backend dev");

        mockMvc.perform(put("/api/users/me/bio")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    void updateBio_blank_returns400() throws Exception {
        var req = new UpdateBioRequest("");

        mockMvc.perform(put("/api/users/me/bio")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void searchUsers_returnsList() throws Exception {
        when(userService.searchUsers(any(), any(), any(Integer.class)))
                .thenReturn(List.of(new UserMatchResponse("abc-123", 0.7)));

        mockMvc.perform(get("/api/users/search").param("query", "backend"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }
}