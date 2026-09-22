package com.bhavya.skillswap.user.service;

import com.bhavya.skillswap.common.ai.UserEmbeddingService;
import com.bhavya.skillswap.common.exception.ResourceNotFoundException;
import com.bhavya.skillswap.skill.entity.Skill;
import com.bhavya.skillswap.skill.repository.SkillRepository;
import com.bhavya.skillswap.user.dto.PublicUserProfileResponse;
import com.bhavya.skillswap.user.dto.UserMatchResponse;
import com.bhavya.skillswap.user.dto.UserSummaryResponse;
import com.bhavya.skillswap.user.entity.User;
import com.bhavya.skillswap.user.repository.UserRepository;
import com.bhavya.skillswap.userskill.entity.UserSkill;
import com.bhavya.skillswap.userskill.entity.UserSkillRole;
import com.bhavya.skillswap.userskill.repository.UserSkillRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserSkillRepository userSkillRepository;
    private final SkillRepository skillRepository;
    private final UserEmbeddingService userEmbeddingService;

    @Transactional
    public void updateBio(UUID userId, String bio) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        user.setBio(bio);
        userRepository.save(user);
        reindexEmbedding(userId);
    }

    /**
     * Rebuilds the user's embedding from bio + their current offered/wanted skills,
     * so semantic search can surface users by skill even with no bio, or a bio that
     * doesn't mention the skill by name.
     */
    public void reindexEmbedding(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        List<UserSkill> userSkills = userSkillRepository.findByUserId(userId);

        String offered = userSkills.stream()
                .filter(s -> s.getRole() == UserSkillRole.OFFERED)
                .map(this::resolveSkillName)
                .filter(n -> !n.isBlank())
                .collect(Collectors.joining(", "));

        String wanted = userSkills.stream()
                .filter(s -> s.getRole() == UserSkillRole.WANTED)
                .map(this::resolveSkillName)
                .filter(n -> !n.isBlank())
                .collect(Collectors.joining(", "));

        StringBuilder combined = new StringBuilder();
        if (user.getBio() != null && !user.getBio().isBlank()) {
            combined.append(user.getBio()).append(". ");
        }
        if (!offered.isBlank()) {
            combined.append("Offers: ").append(offered).append(". ");
        }
        if (!wanted.isBlank()) {
            combined.append("Wants to learn: ").append(wanted).append(".");
        }

        if (combined.isEmpty()) {
            return; // nothing to embed yet
        }

        userEmbeddingService.indexUserBio(userId, combined.toString());
    }

    private String resolveSkillName(UserSkill userSkill) {
        return skillRepository.findById(userSkill.getSkillId())
                .map(Skill::getName)
                .orElse("");
    }

    public List<UserSummaryResponse> findUsersBySkill(UUID currentUserId, String skillName, UserSkillRole role) {
        List<UUID> userIds = userSkillRepository.findUserIdsBySkillNameAndRole(skillName, role.name());

        return userRepository.findAllById(userIds).stream()
                .filter(x -> !x.getId().equals(currentUserId))
                .map(u -> new UserSummaryResponse(u.getId(), u.getDisplayName()))
                .toList();
    }

    public List<UserMatchResponse> searchUsers(UUID requesterId, String query, int topK) {
        return userEmbeddingService.findSimilarUsers(query, requesterId, topK).stream()
                .map(doc -> new UserMatchResponse(
                        (String) doc.getMetadata().get("userId"),
                        doc.getScore()))
                .toList();
    }

    public PublicUserProfileResponse getPublicProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        return new PublicUserProfileResponse(user.getId(), user.getDisplayName(), user.getBio());
    }
}