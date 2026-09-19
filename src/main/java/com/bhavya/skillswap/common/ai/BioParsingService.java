package com.bhavya.skillswap.common.ai;

import com.bhavya.skillswap.userskill.dto.ParsedBioResult;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BioParsingService {

    private final ChatClient.Builder chatClientBuilder;

    private static final String PROMPT_TEMPLATE = """
            Extract skills from this bio text. Categorize each skill as either
            "offered" (skills the person can teach, with an estimated proficiency
            of BEGINNER, INTERMEDIATE, ADVANCED, or EXPERT based on the language used)
            or "wanted" (skills the person wants to learn).
            
            Bio: %s
            """;

    public ParsedBioResult parseBio(String bioText) {
        ChatClient chatClient = chatClientBuilder.build();

        return chatClient.prompt()
                .user(PROMPT_TEMPLATE.formatted(bioText))
                .call()
                .entity(ParsedBioResult.class);
    }
}