package com.bhavya.skillswap.session.dto;

import jakarta.validation.constraints.NotBlank;

public record AcceptSessionRequest(
        @NotBlank String meetingLink
) {
}