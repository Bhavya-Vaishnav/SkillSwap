package com.bhavya.skillswap.skill.dto;

import java.util.UUID;

public record SkillResponse(UUID id, String name, String category) {
}