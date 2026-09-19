package com.bhavya.skillswap.common.ai;

import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PriceSuggestionService {

    private final ChatClient.Builder chatClientBuilder;
    private final PricingToolService pricingToolService;

    private static final String PROMPT_TEMPLATE = """
            The provider wants to know a reasonable credit price to charge for
            tutoring sessions in "%s". Use the pricing tool to check historical
            data for this skill. If data exists, report the average and range
            clearly. If no historical data exists, say so honestly and suggest
            the provider set their own starting price based on their experience
            level — do not invent a number.
            """;

    public String suggestPrice(String skillName) {
        ChatClient chatClient = chatClientBuilder.build();

        return chatClient.prompt()
                .user(PROMPT_TEMPLATE.formatted(skillName))
                .tools(pricingToolService)
                .call()
                .content();
    }
}