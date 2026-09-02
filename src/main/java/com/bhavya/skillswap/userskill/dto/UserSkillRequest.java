package com.bhavya.skillswap.userskill.dto;

import com.bhavya.skillswap.userskill.entity.ProficiencyLevel;
import com.bhavya.skillswap.userskill.entity.UserSkillRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UserSkillRequest(
        @NotBlank String skillName,
        String category,
        @NotNull UserSkillRole role,
        ProficiencyLevel proficiency
) {
}