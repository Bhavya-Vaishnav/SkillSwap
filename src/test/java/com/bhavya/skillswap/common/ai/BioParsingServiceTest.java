package com.bhavya.skillswap.common.ai;

import com.bhavya.skillswap.userskill.dto.ParsedBioResult;
import com.bhavya.skillswap.userskill.dto.ParsedSkill;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BioParsingServiceTest {

    @Mock
    private ChatClient.Builder chatClientBuilder;
    @Mock
    private ChatClient chatClient;
    @Mock
    private ChatClient.ChatClientRequestSpec requestSpec;
    @Mock
    private ChatClient.CallResponseSpec responseSpec;

    @InjectMocks
    private BioParsingService bioParsingService;

    @Test
    void parseBio_returnsStructuredResult() {
        ParsedBioResult expected = new ParsedBioResult(
                List.of(new ParsedSkill("Python", "ADVANCED")),
                List.of("Spanish")
        );

        when(chatClientBuilder.build()).thenReturn(chatClient);
        when(chatClient.prompt()).thenReturn(requestSpec);
        when(requestSpec.user(anyString())).thenReturn(requestSpec);
        when(requestSpec.call()).thenReturn(responseSpec);
        when(responseSpec.entity(ParsedBioResult.class)).thenReturn(expected);

        ParsedBioResult result = bioParsingService.parseBio("I know Python, want to learn Spanish");

        assertThat(result.offered()).hasSize(1);
        assertThat(result.offered().get(0).name()).isEqualTo("Python");
        assertThat(result.wanted()).containsExactly("Spanish");
    }
}