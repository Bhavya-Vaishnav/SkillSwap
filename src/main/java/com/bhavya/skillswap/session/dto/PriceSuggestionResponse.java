package com.bhavya.skillswap.session.dto;

import java.math.BigDecimal;

public record PriceSuggestionResponse(
        String skillName,
        boolean historicalDataAvailable,
        BigDecimal averagePrice,
        BigDecimal minimumPrice,
        BigDecimal maximumPrice,
        long sampleSize,
        String message
) {
}