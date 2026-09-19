package com.bhavya.skillswap.userskill.service;

import com.bhavya.skillswap.common.ai.BioParsingService;
import com.bhavya.skillswap.common.exception.DuplicateResourceException;
import com.bhavya.skillswap.common.exception.InvalidProficiencyException;
import com.bhavya.skillswap.skill.entity.Skill;
import com.bhavya.skillswap.skill.service.SkillService;
import com.bhavya.skillswap.userskill.dto.ParsedBioResult;
import com.bhavya.skillswap.userskill.dto.ParsedSkill;
import com.bhavya.skillswap.userskill.dto.UserSkillRequest;
import com.bhavya.skillswap.userskill.entity.ProficiencyLevel;
import com.bhavya.skillswap.userskill.entity.UserSkill;
import com.bhavya.skillswap.userskill.entity.UserSkillRole;
import com.bhavya.skillswap.userskill.repository.UserSkillRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserSkillServiceTest {

    @Mock
    private UserSkillRepository userSkillRepository;
    @Mock
    private SkillService skillService;
    @Mock
    private BioParsingService bioParsingService;
    @InjectMocks
    private UserSkillService userSkillService;

    @Test
    void addUserSkill_offeredWithProficiency_succeeds() {
        UUID userId = UUID.randomUUID();
        Skill skill = new Skill("Python", "Programming");
        skill.setId(UUID.randomUUID());

        when(skillService.getOrCreateSkill(anyString(), any())).thenReturn(skill);

        UserSkill saved = new UserSkill(userId, skill.getId(), UserSkillRole.OFFERED, ProficiencyLevel.ADVANCED);
        saved.setId(UUID.randomUUID());
        when(userSkillRepository.save(any())).thenReturn(saved);

        var req = new UserSkillRequest("Python", "Programming", UserSkillRole.OFFERED, ProficiencyLevel.ADVANCED);
        var result = userSkillService.addUserSkill(userId, req);

        assertThat(result.role()).isEqualTo(UserSkillRole.OFFERED);
        assertThat(result.proficiency()).isEqualTo(ProficiencyLevel.ADVANCED);
    }

    @Test
    void addUserSkill_offeredWithoutProficiency_throwsException() {
        UUID userId = UUID.randomUUID();
        var req = new UserSkillRequest("Cooking", null, UserSkillRole.OFFERED, null);

        assertThatThrownBy(() -> userSkillService.addUserSkill(userId, req))
                .isInstanceOf(InvalidProficiencyException.class);

        verify(userSkillRepository, never()).save(any());
    }

    @Test
    void addUserSkill_wantedWithProficiency_throwsException() {
        UUID userId = UUID.randomUUID();
        var req = new UserSkillRequest("Chess", null, UserSkillRole.WANTED, ProficiencyLevel.BEGINNER);

        assertThatThrownBy(() -> userSkillService.addUserSkill(userId, req))
                .isInstanceOf(InvalidProficiencyException.class);

        verify(userSkillRepository, never()).save(any());
    }

    @Test
    void addUserSkill_wantedWithoutProficiency_succeeds() {
        UUID userId = UUID.randomUUID();
        Skill skill = new Skill("Guitar", "Music");
        skill.setId(UUID.randomUUID());

        when(skillService.getOrCreateSkill(anyString(), any())).thenReturn(skill);

        UserSkill saved = new UserSkill(userId, skill.getId(), UserSkillRole.WANTED, null);
        saved.setId(UUID.randomUUID());
        when(userSkillRepository.save(any())).thenReturn(saved);

        var req = new UserSkillRequest("Guitar", "Music", UserSkillRole.WANTED, null);
        var result = userSkillService.addUserSkill(userId, req);

        assertThat(result.proficiency()).isNull();
    }

    @Test
    void addUserSkill_duplicateEntry_throwsDuplicateResourceException() {
        UUID userId = UUID.randomUUID();
        Skill skill = new Skill("Python", "Programming");
        skill.setId(UUID.randomUUID());

        when(skillService.getOrCreateSkill(anyString(), any())).thenReturn(skill);
        when(userSkillRepository.save(any())).thenThrow(new DataIntegrityViolationException("duplicate"));

        var req = new UserSkillRequest("Python", "Programming", UserSkillRole.OFFERED, ProficiencyLevel.ADVANCED);

        assertThatThrownBy(() -> userSkillService.addUserSkill(userId, req))
                .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    void getUserSkills_returnsListWithSkillNames() {
        UUID userId = UUID.randomUUID();
        UUID skillId = UUID.randomUUID();

        UserSkill us = new UserSkill(userId, skillId, UserSkillRole.OFFERED, ProficiencyLevel.EXPERT);
        us.setId(UUID.randomUUID());

        when(userSkillRepository.findByUserId(userId)).thenReturn(List.of(us));

        Skill skill = new Skill("Java", "Programming");
        skill.setId(skillId);
        when(skillService.getById(skillId)).thenReturn(skill);

        var result = userSkillService.getUserSkills(userId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).skillName()).isEqualTo("Java");
    }

    @Test
    void parseBio_delegatesToBioParsingService() {
        ParsedBioResult expected = new ParsedBioResult(List.of(), List.of());
        when(bioParsingService.parseBio("some bio")).thenReturn(expected);

        var result = userSkillService.parseBio("some bio");

        assertThat(result).isEqualTo(expected);
    }

    @Test
    void confirmBioSkills_createsOfferedAndWantedSkills() {
        UUID userId = UUID.randomUUID();
        Skill pythonSkill = new Skill("Python", null);
        pythonSkill.setId(UUID.randomUUID());
        Skill spanishSkill = new Skill("Spanish", null);
        spanishSkill.setId(UUID.randomUUID());

        when(skillService.getOrCreateSkill(eq("Python"), any())).thenReturn(pythonSkill);
        when(skillService.getOrCreateSkill(eq("Spanish"), any())).thenReturn(spanishSkill);

        UserSkill savedOffered = new UserSkill(userId, pythonSkill.getId(), UserSkillRole.OFFERED, ProficiencyLevel.ADVANCED);
        savedOffered.setId(UUID.randomUUID());
        UserSkill savedWanted = new UserSkill(userId, spanishSkill.getId(), UserSkillRole.WANTED, null);
        savedWanted.setId(UUID.randomUUID());

        when(userSkillRepository.save(any()))
                .thenReturn(savedOffered)
                .thenReturn(savedWanted);

        var confirmed = new ParsedBioResult(
                List.of(new ParsedSkill("Python", "ADVANCED")),
                List.of("Spanish")
        );

        var results = userSkillService.confirmBioSkills(userId, confirmed);

        assertThat(results).hasSize(2);
        verify(userSkillRepository, times(2)).save(any());
    }

    @Test
    void confirmBioSkills_invalidProficiency_fallsBackToIntermediate() {
        UUID userId = UUID.randomUUID();
        Skill skill = new Skill("Cooking", null);
        skill.setId(UUID.randomUUID());

        when(skillService.getOrCreateSkill(eq("Cooking"), any())).thenReturn(skill);

        UserSkill saved = new UserSkill(userId, skill.getId(), UserSkillRole.OFFERED, ProficiencyLevel.INTERMEDIATE);
        saved.setId(UUID.randomUUID());
        when(userSkillRepository.save(any())).thenReturn(saved);

        var confirmed = new ParsedBioResult(
                List.of(new ParsedSkill("Cooking", "pretty good")), // not a valid enum value
                List.of()
        );

        var results = userSkillService.confirmBioSkills(userId, confirmed);

        assertThat(results.get(0).proficiency()).isEqualTo(ProficiencyLevel.INTERMEDIATE);
    }
}