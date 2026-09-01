package com.bhavya.skillswap.ledger.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record BalanceResponse(UUID userId, BigDecimal balance) {
}