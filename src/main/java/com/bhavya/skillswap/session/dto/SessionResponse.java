package com.bhavya.skillswap.session.dto;

import com.bhavya.skillswap.session.entity.SessionStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record SessionResponse(
        UUID id,
        UUID requesterId,
        String requesterName,
        String requesterEmail,
        UUID providerId,
        String providerName,
        String providerEmail,
        UUID skillId,
        BigDecimal creditAmount,
        SessionStatus status,
        String meetingLink,
        Instant createdAt,
        Instant updatedAt
) {
}