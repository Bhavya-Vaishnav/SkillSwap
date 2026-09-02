package com.bhavya.skillswap.userskill.dto;

import com.bhavya.skillswap.userskill.entity.ProficiencyLevel;
import com.bhavya.skillswap.userskill.entity.UserSkillRole;

import java.util.UUID;

public record UserSkillResponse(
        UUID id,
        UUID skillId,
        String skillName,
        UserSkillRole role,
        ProficiencyLevel proficiency
) {
}