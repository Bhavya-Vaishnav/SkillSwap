package com.bhavya.skillswap.ledger.dto;

import com.bhavya.skillswap.ledger.entity.LedgerEntryType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record TransferRequest(
        @NotNull UUID toUserId,
        @NotNull @DecimalMin(value = "0.01") BigDecimal amount,
        @NotNull LedgerEntryType entryType,
        UUID referenceId
) {
}