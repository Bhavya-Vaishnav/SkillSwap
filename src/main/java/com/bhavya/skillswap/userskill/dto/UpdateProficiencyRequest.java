package com.bhavya.skillswap.userskill.dto;

import com.bhavya.skillswap.userskill.entity.ProficiencyLevel;
import jakarta.validation.constraints.NotNull;

public record UpdateProficiencyRequest(@NotNull ProficiencyLevel proficiency) {
}