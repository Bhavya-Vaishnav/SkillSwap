package com.bhavya.skillswap.common.ai;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SkillEmbeddingServiceTest {

    @Mock
    private VectorStore vectorStore;
    @InjectMocks
    private SkillEmbeddingService skillEmbeddingService;

    @Test
    void indexSkill_addsDocumentWithCorrectMetadata() {
        UUID skillId = UUID.randomUUID();

        skillEmbeddingService.indexSkill(skillId, "Python", "Programming");

        ArgumentCaptor<List<Document>> captor = ArgumentCaptor.forClass(List.class);
        verify(vectorStore).add(captor.capture());

        Document doc = captor.getValue().get(0);
        assertThat(doc.getMetadata().get("skillId")).isEqualTo(skillId.toString());
        assertThat(doc.getMetadata().get("type")).isEqualTo("skill");
        assertThat(doc.getMetadata().get("name")).isEqualTo("Python");
    }

    @Test
    void findSimilarSkills_callsVectorStoreWithFilter() {
        when(vectorStore.similaritySearch(any(SearchRequest.class)))
                .thenReturn(List.of());

        skillEmbeddingService.findSimilarSkills("music", 5);

        verify(vectorStore).similaritySearch(any(SearchRequest.class));
    }
}