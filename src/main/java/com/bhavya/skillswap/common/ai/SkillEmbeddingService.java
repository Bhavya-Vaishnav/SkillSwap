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
public class SkillEmbeddingService {

    private static final String TYPE_SKILL = "skill";

    private final VectorStore vectorStore;

    public void indexSkill(UUID skillId, String name, String category) {
        String content = category != null
                ? String.format("%s is a skill in the category of %s.", name, category)
                : name;
        Document document = new Document(skillId.toString(), content, Map.of(
                "type", TYPE_SKILL,
                "skillId", skillId.toString(),
                "name", name
        ));
        vectorStore.add(List.of(document));
    }

    public List<Document> findSimilarSkills(String queryText, int topK) {
        Filter.Expression filter = new Filter.Expression(
                Filter.ExpressionType.EQ,
                new Filter.Key("type"),
                new Filter.Value(TYPE_SKILL)
        );

        SearchRequest request = SearchRequest.builder()
                .query(queryText)
                .topK(topK)
                .similarityThreshold(0.55)
                .filterExpression(filter)
                .build();

        return vectorStore.similaritySearch(request);
    }
}