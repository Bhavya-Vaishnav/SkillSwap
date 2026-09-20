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
            Extract technical skills from the following bio for a peer-to-peer
            skill exchange platform.
            
            Return two groups:
            
            OFFERED:
            Skills the person has explicitly stated they know, use, have
            experience with, or can teach.
            
            WANTED:
            Skills the person has explicitly stated they want to learn,
            improve, or are currently learning.
            
            Rules:
            - Only use information supported by the bio.
            - Never invent or assume skills.
            - Do not infer a skill from a related technology.
            - Prefer specific technical skills over broad categories.
            - Avoid generic categories such as "Software Development",
              "Backend Development", "Databases", or "AI Applications"
              unless explicitly presented as a skill.
            - Do not treat a technology as proof of another skill.
              For example, PostgreSQL does not automatically imply
              "Database Administration".
            - Do not duplicate skills.
            - Keep each skill name short and suitable for a skill marketplace.
            - A skill that the person is learning should be WANTED.
            - For OFFERED skills, estimate proficiency as BEGINNER,
              INTERMEDIATE, ADVANCED, or EXPERT.
            - Do not claim ADVANCED or EXPERT without enough evidence.
            - If proficiency cannot reasonably be determined, use INTERMEDIATE.
            
            Bio:
            %s
            """;

    public ParsedBioResult parseBio(String bioText) {
        ChatClient chatClient = chatClientBuilder.build();

        return chatClient.prompt()
                .user(PROMPT_TEMPLATE.formatted(bioText))
                .call()
                .entity(ParsedBioResult.class);
    }
}