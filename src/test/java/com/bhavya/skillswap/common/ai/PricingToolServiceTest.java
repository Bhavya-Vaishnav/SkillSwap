package com.bhavya.skillswap.common.ai;

import com.bhavya.skillswap.common.ai.dto.PricingStats;
import com.bhavya.skillswap.session.repository.SessionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PricingToolServiceTest {

    @Mock
    private SessionRepository sessionRepository;

    @InjectMocks
    private PricingToolService pricingToolService;

    @Test
    void getHistoricalPricing_withData_returnsStats() {
        Object[] row = new Object[]{
                5L,
                new BigDecimal("10.50"),
                new BigDecimal("5.00"),
                new BigDecimal("15.00")
        };

        List<Object[]> results = List.<Object[]>of(row);

        when(sessionRepository.getPricingStats("Python"))
                .thenReturn(results);

        PricingStats result =
                pricingToolService.getHistoricalPricing("Python");

        assertThat(result.sampleSize()).isEqualTo(5);
        assertThat(result.average()).isEqualByComparingTo("10.50");
    }

    @Test
    void getHistoricalPricing_noData_returnsEmpty() {
        Object[] row = new Object[]{
                0L,
                null,
                null,
                null
        };

        List<Object[]> results = List.<Object[]>of(row);

        when(sessionRepository.getPricingStats("NonexistentSkill"))
                .thenReturn(results);

        PricingStats result =
                pricingToolService.getHistoricalPricing("NonexistentSkill");

        assertThat(result.sampleSize()).isZero();
    }

    @Test
    void getHistoricalPricing_countAsInteger_handlesNumberConversion() {
        Object[] row = new Object[]{
                3,
                new BigDecimal("8.00"),
                new BigDecimal("6.00"),
                new BigDecimal("10.00")
        };

        List<Object[]> results = List.<Object[]>of(row);

        when(sessionRepository.getPricingStats("Guitar"))
                .thenReturn(results);

        PricingStats result =
                pricingToolService.getHistoricalPricing("Guitar");

        assertThat(result.sampleSize()).isEqualTo(3);
    }
}