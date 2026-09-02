package com.bhavya.skillswap.session.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record SessionRequest(
        @NotNull UUID providerId,
        @NotNull UUID skillId,
        @NotNull @DecimalMin(value = "0.01") BigDecimal creditAmount
) {
}