package com.bhavya.skillswap.user.dto;

import java.util.UUID;

public record UserSummaryResponse(UUID userId, String displayName) {
}