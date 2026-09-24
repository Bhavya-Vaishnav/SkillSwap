package com.bhavya.skillswap.common.ai;

import com.bhavya.skillswap.session.dto.PriceSuggestionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PriceSuggestionService {

    private final ChatClient.Builder chatClientBuilder;
    private final PricingToolService pricingToolService;

    private static final String PROMPT_TEMPLATE = """
            You are a pricing assistant for SkillSwap.
            
            The provider wants pricing information for "%s".
            
            Use the historical pricing tool.
            
            Rules:
            - Always use the pricing tool.
            - Never invent pricing data.
            - Use only numbers returned by the tool.
            - If sample size is 0, historicalDataAvailable must be false.
            - If sample size is greater than 0, historicalDataAvailable must be true.
            - When historical data exists, return the exact average, minimum,
              maximum, and sample size returned by the tool.
            - Do not modify, round, or recalculate those values.
            - Keep the message short.
            """;

    @Cacheable(value = "pricingStats", key = "#skillName.toLowerCase()")
    public PriceSuggestionResponse suggestPrice(String skillName) {

        ChatClient chatClient = chatClientBuilder.build();

        return chatClient.prompt()
                .user(PROMPT_TEMPLATE.formatted(skillName))
                .tools(pricingToolService)
                .call()
                .entity(PriceSuggestionResponse.class);
    }
}