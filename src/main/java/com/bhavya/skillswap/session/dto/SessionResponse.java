package com.bhavya.skillswap.session.dto;

import com.bhavya.skillswap.session.entity.SessionStatus;

import java.math.BigDecimal;
import java.util.UUID;

public record SessionResponse(
        UUID id,
        UUID requesterId,
        UUID providerId,
        UUID skillId,
        BigDecimal creditAmount,
        SessionStatus status,
        String meetingLink
) {
}