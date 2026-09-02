package com.bhavya.skillswap.userskill.service;

import com.bhavya.skillswap.common.exception.DuplicateResourceException;
import com.bhavya.skillswap.common.exception.InvalidProficiencyException;
import com.bhavya.skillswap.skill.entity.Skill;
import com.bhavya.skillswap.skill.service.SkillService;
import com.bhavya.skillswap.userskill.dto.UserSkillRequest;
import com.bhavya.skillswap.userskill.dto.UserSkillResponse;
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

    private UserSkillResponse toResponse(UserSkill us, String skillName) {
        return new UserSkillResponse(us.getId(), us.getSkillId(), skillName, us.getRole(), us.getProficiency());
    }
}