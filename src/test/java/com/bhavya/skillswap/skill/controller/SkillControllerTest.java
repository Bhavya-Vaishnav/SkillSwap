package com.bhavya.skillswap.skill.controller;

import com.bhavya.skillswap.common.util.JwtUtil;
import com.bhavya.skillswap.skill.dto.SkillMatchResponse;
import com.bhavya.skillswap.skill.dto.SkillRequest;
import com.bhavya.skillswap.skill.dto.SkillResponse;
import com.bhavya.skillswap.skill.service.SkillService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SkillController.class)
@AutoConfigureMockMvc(addFilters = false)
class SkillControllerTest {

    @Autowired
    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private SkillService skillService;
    @MockitoBean
    private JwtUtil jwtUtil;

    @Test
    void createSkill_valid_returns201() throws Exception {
        SkillRequest req = new SkillRequest("Python", "Programming");
        SkillResponse res = new SkillResponse(UUID.randomUUID(), "Python", "Programming");

        when(skillService.createSkill(any())).thenReturn(res);

        mockMvc.perform(post("/api/skills")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Python"));
    }

    @Test
    void createSkill_blankName_returns400() throws Exception {
        SkillRequest req = new SkillRequest("", "Programming");

        mockMvc.perform(post("/api/skills")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listAll_returnsSkillList() throws Exception {
        when(skillService.listAll()).thenReturn(List.of(
                new SkillResponse(UUID.randomUUID(), "Python", "Programming"),
                new SkillResponse(UUID.randomUUID(), "Guitar", "Music")
        ));

        mockMvc.perform(get("/api/skills"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void searchSkills_returnsMatchList() throws Exception {
        when(skillService.searchSkills(any(), any(Integer.class)))
                .thenReturn(List.of(new SkillMatchResponse("abc-123", "Piano", 0.63)));

        mockMvc.perform(get("/api/skills/search").param("query", "music"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }
}