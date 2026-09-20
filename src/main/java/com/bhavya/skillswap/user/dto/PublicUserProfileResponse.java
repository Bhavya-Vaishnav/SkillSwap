package com.bhavya.skillswap.user.dto;

import java.util.UUID;

public record PublicUserProfileResponse(
        UUID id,
        String displayName,
        String bio
) {
}