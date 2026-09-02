package com.bhavya.skillswap.skill.service;

import com.bhavya.skillswap.skill.entity.Skill;
import com.bhavya.skillswap.skill.repository.SkillRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SkillServiceTest {

    @Mock
    private SkillRepository skillRepository;
    @InjectMocks
    private SkillService skillService;

    @Test
    void getOrCreateSkill_existingSkill_returnsExisting() {
        Skill existing = new Skill("Python", "Programming");
        existing.setId(UUID.randomUUID());

        when(skillRepository.findByNameIgnoreCase("Python")).thenReturn(Optional.of(existing));

        Skill result = skillService.getOrCreateSkill("Python", "Programming");

        assertThat(result.getId()).isEqualTo(existing.getId());
        verify(skillRepository, never()).save(any());
    }

    @Test
    void getOrCreateSkill_newSkill_createsAndReturns() {
        when(skillRepository.findByNameIgnoreCase("Rust")).thenReturn(Optional.empty());

        Skill saved = new Skill("Rust", "Programming");
        saved.setId(UUID.randomUUID());
        when(skillRepository.save(any(Skill.class))).thenReturn(saved);

        Skill result = skillService.getOrCreateSkill("Rust", "Programming");

        assertThat(result.getName()).isEqualTo("Rust");
        verify(skillRepository).save(any(Skill.class));
    }

    @Test
    void getOrCreateSkill_trimsWhitespace() {
        when(skillRepository.findByNameIgnoreCase("Java")).thenReturn(Optional.empty());

        Skill saved = new Skill("Java", null);
        saved.setId(UUID.randomUUID());
        when(skillRepository.save(any(Skill.class))).thenReturn(saved);

        skillService.getOrCreateSkill("  Java  ", null);

        verify(skillRepository).findByNameIgnoreCase("Java");
    }

    @Test
    void getOrCreateSkill_raceCondition_fallsBackToExisting() {
        when(skillRepository.findByNameIgnoreCase("Go"))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(new Skill("Go", "Programming")));

        when(skillRepository.save(any(Skill.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate key"));

        Skill result = skillService.getOrCreateSkill("Go", "Programming");

        assertThat(result.getName()).isEqualTo("Go");
        verify(skillRepository, times(2)).findByNameIgnoreCase("Go");
    }

    @Test
    void getById_notFound_throwsException() {
        UUID id = UUID.randomUUID();
        when(skillRepository.findById(id)).thenReturn(Optional.empty());

        org.junit.jupiter.api.Assertions.assertThrows(
                com.bhavya.skillswap.common.exception.ResourceNotFoundException.class,
                () -> skillService.getById(id));
    }
}