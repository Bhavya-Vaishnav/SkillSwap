package com.bhavya.skillswap.common;

import com.bhavya.skillswap.common.ai.BioParsingService;
import com.bhavya.skillswap.common.ai.PriceSuggestionService;
import com.bhavya.skillswap.common.ai.SkillEmbeddingService;
import com.bhavya.skillswap.common.ai.UserEmbeddingService;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

@SpringBootTest
public abstract class BaseIntegrationTest {

    private static final DockerImageName PGVECTOR_IMAGE = DockerImageName
            .parse("pgvector/pgvector:pg16")
            .asCompatibleSubstituteFor("postgres");

    @ServiceConnection
    protected static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(PGVECTOR_IMAGE)
            .withDatabaseName("skillswap_test")
            .withUsername("test")
            .withPassword("test");

    static {
        postgres.start();
    }

    // Mock only external AI dependencies so tests run 100% offline without Gemini
    @MockitoBean
    protected SkillEmbeddingService skillEmbeddingService;

    @MockitoBean
    protected UserEmbeddingService userEmbeddingService;

    @MockitoBean
    protected BioParsingService bioParsingService;

    @MockitoBean
    protected PriceSuggestionService priceSuggestionService;
}
