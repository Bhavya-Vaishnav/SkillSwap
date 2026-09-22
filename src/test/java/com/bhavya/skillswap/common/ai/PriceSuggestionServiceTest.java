package com.bhavya.skillswap.common.ai;

import com.bhavya.skillswap.session.dto.PriceSuggestionResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PriceSuggestionServiceTest {

    @Mock
    private ChatClient.Builder chatClientBuilder;
    @Mock
    private ChatClient chatClient;
    @Mock
    private ChatClient.ChatClientRequestSpec requestSpec;
    @Mock
    private ChatClient.CallResponseSpec responseSpec;
    @Mock
    private PricingToolService pricingToolService;

    @InjectMocks
    private PriceSuggestionService priceSuggestionService;

    @Test
    void suggestPrice_returnsLlmContent() {
        when(chatClientBuilder.build()).thenReturn(chatClient);
        when(chatClient.prompt()).thenReturn(requestSpec);
        when(requestSpec.user(anyString())).thenReturn(requestSpec);
        when(requestSpec.tools(any(Object[].class))).thenReturn(requestSpec);
        when(requestSpec.call()).thenReturn(responseSpec);
        when(responseSpec.content()).thenReturn("Based on 5 completed sessions, average is 10.5 credits.");

        PriceSuggestionResponse result = priceSuggestionService.suggestPrice("Python");

//        assertThat(result).contains(result.averagePrice()10.5);
        verify(requestSpec).tools(pricingToolService);
    }
}