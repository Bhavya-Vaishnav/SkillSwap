package com.bhavya.skillswap.skill.service;

import com.bhavya.skillswap.common.ai.SkillEmbeddingService;
import com.bhavya.skillswap.skill.dto.SkillMatchResponse;
import com.bhavya.skillswap.skill.dto.SkillRequest;
import com.bhavya.skillswap.skill.dto.SkillResponse;
import com.bhavya.skillswap.skill.entity.Skill;
import com.bhavya.skillswap.skill.repository.SkillRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.document.Document;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SkillService {

    private final SkillRepository skillRepository;

    /**
     * Create-if-not-exists: normalizes name, checks existing (case-insensitive),
     * returns existing or creates new. Handles race via unique constraint fallback.
     */
    private final SkillEmbeddingService skillEmbeddingService;

    @Transactional
    public Skill getOrCreateSkill(String name, String category) {
        String trimmedName = name.trim();

        return skillRepository.findByNameIgnoreCase(trimmedName)
                .orElseGet(() -> {
                    try {
                        Skill skill = new Skill(trimmedName, category);
                        Skill saved = skillRepository.save(skill);
                        skillEmbeddingService.indexSkill(saved.getId(), saved.getName(), saved.getCategory());
                        return saved;
                    } catch (DataIntegrityViolationException e) {
                        return skillRepository.findByNameIgnoreCase(trimmedName)
                                .orElseThrow(() -> e);
                    }
                });
    }

    public SkillResponse createSkill(SkillRequest req) {
        Skill skill = getOrCreateSkill(req.name(), req.category());
        return toResponse(skill);
    }

    public List<SkillMatchResponse> searchSkills(String query, int topK) {
        List<Document> results = skillEmbeddingService.findSimilarSkills(query, topK);
        return results.stream()
                .map(doc -> new SkillMatchResponse(
                        (String) doc.getMetadata().get("skillId"),
                        (String) doc.getMetadata().get("name"),
                        doc.getScore()))
                .toList();
    }

    public List<SkillResponse> listAll() {
        return skillRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public Skill getById(UUID id) {
        return skillRepository.findById(id)
                .orElseThrow(() -> new com.bhavya.skillswap.common.exception.ResourceNotFoundException(
                        "Skill not found: " + id));
    }

    private SkillResponse toResponse(Skill skill) {
        return new SkillResponse(skill.getId(), skill.getName(), skill.getCategory());
    }
}