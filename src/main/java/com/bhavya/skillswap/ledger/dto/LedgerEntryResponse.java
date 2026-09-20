package com.bhavya.skillswap.ledger.dto;

import com.bhavya.skillswap.ledger.entity.LedgerEntryType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record LedgerEntryResponse(
        UUID id,
        BigDecimal amount,
        LedgerEntryType entryType,
        UUID referenceId,
        Instant createdAt
) {
}