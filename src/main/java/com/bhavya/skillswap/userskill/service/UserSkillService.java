package com.bhavya.skillswap.userskill.service;

import com.bhavya.skillswap.common.ai.BioParsingService;
import com.bhavya.skillswap.common.exception.DuplicateResourceException;
import com.bhavya.skillswap.common.exception.InvalidProficiencyException;
import com.bhavya.skillswap.skill.entity.Skill;
import com.bhavya.skillswap.skill.service.SkillService;
import com.bhavya.skillswap.userskill.dto.ParsedBioResult;
import com.bhavya.skillswap.userskill.dto.UserSkillRequest;
import com.bhavya.skillswap.userskill.dto.UserSkillResponse;
import com.bhavya.skillswap.userskill.entity.ProficiencyLevel;
import com.bhavya.skillswap.userskill.entity.UserSkill;
import com.bhavya.skillswap.userskill.entity.UserSkillRole;
import com.bhavya.skillswap.userskill.repository.UserSkillRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserSkillService {

    private final UserSkillRepository userSkillRepository;
    private final SkillService skillService;
    private final BioParsingService bioParsingService;

    @Transactional
    public UserSkillResponse addUserSkill(UUID userId, UserSkillRequest req) {
        if (req.role() == UserSkillRole.OFFERED && req.proficiency() == null) {
            throw new InvalidProficiencyException("Proficiency is required when role is OFFERED");
        }
        if (req.role() == UserSkillRole.WANTED && req.proficiency() != null) {
            throw new InvalidProficiencyException("Proficiency must be null when role is WANTED");
        }

        Skill skill = skillService.getOrCreateSkill(req.skillName(), req.category());

        try {
            UserSkill userSkill = new UserSkill(userId, skill.getId(), req.role(), req.proficiency());
            UserSkill saved = userSkillRepository.save(userSkill);
            return toResponse(saved, skill.getName());
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new DuplicateResourceException(
                    "You have already added this skill with role " + req.role());
        }
    }

    public List<UserSkillResponse> getUserSkills(UUID userId) {
        return userSkillRepository.findByUserId(userId).stream()
                .map(us -> {
                    Skill skill = skillService.getById(us.getSkillId());
                    return toResponse(us, skill.getName());
                })
                .toList();
    }

    public ParsedBioResult parseBio(String bioText) {
        return bioParsingService.parseBio(bioText);
    }

    @Transactional
    public List<UserSkillResponse> confirmBioSkills(UUID userId, ParsedBioResult confirmed) {
        List<UserSkillResponse> results = new java.util.ArrayList<>();

        for (var offered : confirmed.offered()) {
            ProficiencyLevel proficiency;
            try {
                proficiency = ProficiencyLevel.valueOf(offered.proficiency().toUpperCase());
            } catch (Exception e) {
                proficiency = ProficiencyLevel.INTERMEDIATE; // safe fallback if LLM returns something unexpected
            }
            var req = new UserSkillRequest(offered.name(), null, UserSkillRole.OFFERED, proficiency);
            results.add(addUserSkill(userId, req));
        }

        for (String wanted : confirmed.wanted()) {
            var req = new UserSkillRequest(wanted, null, UserSkillRole.WANTED, null);
            results.add(addUserSkill(userId, req));
        }

        return results;
    }

    private UserSkillResponse toResponse(UserSkill us, String skillName) {
        return new UserSkillResponse(us.getId(), us.getSkillId(), skillName, us.getRole(), us.getProficiency());
    }
}