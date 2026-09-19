package com.bhavya.skillswap.common.ai;

import com.bhavya.skillswap.common.ai.dto.PricingStats;
import com.bhavya.skillswap.session.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PricingToolService {

    private final SessionRepository sessionRepository;

    @Tool(description = "Get historical pricing statistics (average, min, max credit amount) " +
            "for completed tutoring sessions of a given skill name. Returns sample size 0 if no data exists.")
    public PricingStats getHistoricalPricing(
            @ToolParam(description = "The name of the skill to check pricing for, e.g. 'Python' or 'Guitar'")
            String skillName) {

        List<Object[]> rows = sessionRepository.getPricingStats(skillName);

        if (rows.isEmpty()) {
            return PricingStats.empty();
        }

        Object[] row = rows.get(0);

        long count = ((Number) row[0]).longValue();
        if (count == 0) {
            return PricingStats.empty();
        }

        BigDecimal avg = row[1] != null ? new BigDecimal(row[1].toString()) : null;
        BigDecimal min = row[2] != null ? new BigDecimal(row[2].toString()) : null;
        BigDecimal max = row[3] != null ? new BigDecimal(row[3].toString()) : null;

        return new PricingStats(count, avg, min, max);
    }
}