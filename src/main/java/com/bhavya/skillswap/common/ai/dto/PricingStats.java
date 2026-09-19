package com.bhavya.skillswap.common.ai.dto;

import java.math.BigDecimal;

public record PricingStats(long sampleSize, BigDecimal average, BigDecimal min, BigDecimal max) {

    public static PricingStats empty() {
        return new PricingStats(0, null, null, null);
    }
}