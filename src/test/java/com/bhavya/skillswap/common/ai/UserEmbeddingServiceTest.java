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
class UserEmbeddingServiceTest {

    @Mock
    private VectorStore vectorStore;
    @InjectMocks
    private UserEmbeddingService userEmbeddingService;

    @Test
    void indexUserBio_deletesOldThenAddsNew() {
        UUID userId = UUID.randomUUID();

        userEmbeddingService.indexUserBio(userId, "I love backend development");

        verify(vectorStore).delete(List.of(userId.toString()));

        ArgumentCaptor<List<Document>> captor = ArgumentCaptor.forClass(List.class);
        verify(vectorStore).add(captor.capture());

        Document doc = captor.getValue().get(0);
        assertThat(doc.getMetadata().get("userId")).isEqualTo(userId.toString());
        assertThat(doc.getMetadata().get("type")).isEqualTo("user_bio");
    }

    @Test
    void findSimilarUsers_excludesRequestingUser() {
        UUID selfId = UUID.randomUUID();
        UUID otherId = UUID.randomUUID();

        Document selfDoc = new Document("bio1", java.util.Map.of("userId", selfId.toString()));
        Document otherDoc = new Document("bio2", java.util.Map.of("userId", otherId.toString()));

        when(vectorStore.similaritySearch(any(SearchRequest.class)))
                .thenReturn(List.of(selfDoc, otherDoc));

        List<Document> results = userEmbeddingService.findSimilarUsers("backend dev", selfId, 5);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getMetadata().get("userId")).isEqualTo(otherId.toString());
    }
}