package com.bhavya.skillswap.skill.service;

import com.bhavya.skillswap.skill.dto.SkillRequest;
import com.bhavya.skillswap.skill.dto.SkillResponse;
import com.bhavya.skillswap.skill.entity.Skill;
import com.bhavya.skillswap.skill.repository.SkillRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
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
    @Transactional
    public Skill getOrCreateSkill(String name, String category) {
        String trimmedName = name.trim();

        return skillRepository.findByNameIgnoreCase(trimmedName)
                .orElseGet(() -> {
                    try {
                        Skill skill = new Skill(trimmedName, category);
                        return skillRepository.save(skill);
                    } catch (DataIntegrityViolationException e) {
                        // race: another request created same skill between our check and insert
                        return skillRepository.findByNameIgnoreCase(trimmedName)
                                .orElseThrow(() -> e);
                    }
                });
    }

    public SkillResponse createSkill(SkillRequest req) {
        Skill skill = getOrCreateSkill(req.name(), req.category());
        return toResponse(skill);
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