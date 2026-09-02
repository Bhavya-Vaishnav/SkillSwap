package com.bhavya.skillswap.skill.dto;

import jakarta.validation.constraints.NotBlank;

public record SkillRequest(
        @NotBlank String name,
        String category
) {
}