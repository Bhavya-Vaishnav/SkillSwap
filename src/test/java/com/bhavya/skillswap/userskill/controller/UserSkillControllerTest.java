package com.bhavya.skillswap.userskill.controller;

import com.bhavya.skillswap.common.util.JwtUtil;
import com.bhavya.skillswap.userskill.dto.*;
import com.bhavya.skillswap.userskill.entity.ProficiencyLevel;
import com.bhavya.skillswap.userskill.entity.UserSkillRole;
import com.bhavya.skillswap.userskill.service.UserSkillService;
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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserSkillController.class)
@AutoConfigureMockMvc(addFilters = false)
class UserSkillControllerTest {

    @Autowired
    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private UserSkillService userSkillService;
    @MockitoBean
    private JwtUtil jwtUtil;

    @Test
    void addSkill_valid_returns201() throws Exception {
        var req = new UserSkillRequest("Python", "Programming", UserSkillRole.OFFERED, ProficiencyLevel.ADVANCED);
        var res = new UserSkillResponse(UUID.randomUUID(), UUID.randomUUID(), "Python",
                UserSkillRole.OFFERED, ProficiencyLevel.ADVANCED);

        when(userSkillService.addUserSkill(any(), any())).thenReturn(res);

        mockMvc.perform(post("/api/user-skills")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.skillName").value("Python"));
    }

    @Test
    void getMySkills_returnsList() throws Exception {
        when(userSkillService.getUserSkills(any())).thenReturn(List.of(
                new UserSkillResponse(UUID.randomUUID(), UUID.randomUUID(), "Python",
                        UserSkillRole.OFFERED, ProficiencyLevel.ADVANCED)
        ));

        mockMvc.perform(get("/api/user-skills/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void parseBio_returnsStructuredResult() throws Exception {
        var req = new ParseBioRequest("I know Python, want to learn Spanish");
        var expected = new ParsedBioResult(
                List.of(new ParsedSkill("Python", "ADVANCED")),
                List.of("Spanish")
        );

        when(userSkillService.parseBio(anyString())).thenReturn(expected);

        mockMvc.perform(post("/api/user-skills/parse-bio")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.offered[0].name").value("Python"));
    }

    @Test
    void confirmBio_returnsSavedSkills() throws Exception {
        var confirmed = new ParsedBioResult(
                List.of(new ParsedSkill("Python", "ADVANCED")),
                List.of()
        );
        var req = new ConfirmBioRequest(confirmed);

        var savedResponse = new UserSkillResponse(UUID.randomUUID(), UUID.randomUUID(), "Python",
                UserSkillRole.OFFERED, ProficiencyLevel.ADVANCED);

        when(userSkillService.confirmBioSkills(any(), any())).thenReturn(List.of(savedResponse));

        mockMvc.perform(post("/api/user-skills/confirm-bio")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }
}