package com.bhavya.skillswap.common.ai;

import lombok.RequiredArgsConstructor;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.Filter;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserEmbeddingService {

    private static final String TYPE_USER_BIO = "user_bio";
    private static final double SIMILARITY_THRESHOLD = 0.55;

    private final VectorStore vectorStore;

    /**
     * Deletes any existing embedding for this user before adding the new one,
     * so bio updates overwrite instead of accumulating duplicate documents.
     */
    public void indexUserBio(UUID userId, String bio) {
        // delete-then-add: Spring AI's VectorStore doesn't guarantee upsert-by-ID
        // across all store implementations, so explicit delete is the safe path
        vectorStore.delete(List.of(userId.toString()));

        Document document = new Document(userId.toString(), bio, Map.of(
                "type", TYPE_USER_BIO,
                "userId", userId.toString()
        ));
        vectorStore.add(List.of(document));
    }

    public List<Document> findSimilarUsers(String queryText, UUID excludeUserId, int topK) {
        Filter.Expression filter = new Filter.Expression(
                Filter.ExpressionType.EQ,
                new Filter.Key("type"),
                new Filter.Value(TYPE_USER_BIO)
        );

        SearchRequest request = SearchRequest.builder()
                .query(queryText)
                .topK(topK + 1) // +1 buffer in case the searching user matches themselves
                .similarityThreshold(SIMILARITY_THRESHOLD)
                .filterExpression(filter)
                .build();

        return vectorStore.similaritySearch(request).stream()
                .filter(doc -> !doc.getMetadata().get("userId").equals(excludeUserId.toString()))
                .limit(topK)
                .toList();
    }
}