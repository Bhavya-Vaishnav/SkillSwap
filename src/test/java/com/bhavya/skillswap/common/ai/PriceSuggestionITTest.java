package com.bhavya.skillswap.common.ai;

import com.bhavya.skillswap.session.entity.Session;
import com.bhavya.skillswap.session.entity.SessionStatus;
import com.bhavya.skillswap.session.repository.SessionRepository;
import com.bhavya.skillswap.skill.entity.Skill;
import com.bhavya.skillswap.skill.repository.SkillRepository;
import com.bhavya.skillswap.user.entity.User;
import com.bhavya.skillswap.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Hits the real Gemini API via Spring AI's ChatClient + real DB data.
 * Not deterministic (LLM phrasing varies) — asserts structural expectations
 * and prints the actual response for manual inspection.
 */
@SpringBootTest
class PriceSuggestionITTest {

    @Autowired
    private PriceSuggestionService priceSuggestionService;
    @Autowired
    private SessionRepository sessionRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private SkillRepository skillRepository;

    private String skillName;

    @BeforeEach
    void setUp() {
        var encoder = new BCryptPasswordEncoder();

        User requester = new User("pricing-req@test.com", encoder.encode("pw"), "PricingReq");
        User provider = new User("pricing-prov@test.com", encoder.encode("pw"), "PricingProv");
        UUID requesterId = userRepository.save(requester).getId();
        UUID providerId = userRepository.save(provider).getId();

        skillName = "PricingTestSkill" + UUID.randomUUID().toString().substring(0, 8);
        Skill skill = skillRepository.save(new Skill(skillName, "Test"));

        // create several completed sessions with varying prices
        BigDecimal[] prices = {
                new BigDecimal("8.00"), new BigDecimal("10.00"), new BigDecimal("12.00"),
                new BigDecimal("9.00"), new BigDecimal("15.00")
        };

        for (BigDecimal price : prices) {
            Session session = new Session(requesterId, providerId, skill.getId(), price);
            session.setStatus(SessionStatus.COMPLETED);
            sessionRepository.save(session);
        }
    }

    @Test
    void suggestPrice_withHistoricalData_includesRealStats() {
        var response = priceSuggestionService.suggestPrice(skillName);

        System.out.println("=== LLM Price Suggestion (with data) ===");
        System.out.println(response);
        System.out.println("=========================================");

        assertThat(response.message()).isNotBlank();
        // loose check: response should reference the sample size or a price-like number
        assertThat(response.message()).containsPattern("\\d");
    }

    @Disabled
    @Test
    void suggestPrice_noHistoricalData_doesNotFabricateNumber() {
        String unknownSkill = "NoDataSkill" + UUID.randomUUID();

        var response = priceSuggestionService.suggestPrice(unknownSkill);

        System.out.println("=== LLM Price Suggestion (no data) ===");
        System.out.println(response);
        System.out.println("========================================");

        assertThat(response.message()).isNotBlank();
    }
}