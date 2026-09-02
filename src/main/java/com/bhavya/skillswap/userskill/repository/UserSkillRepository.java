package com.bhavya.skillswap.userskill.repository;

import com.bhavya.skillswap.userskill.entity.UserSkill;
import com.bhavya.skillswap.userskill.entity.UserSkillRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserSkillRepository extends JpaRepository<UserSkill, UUID> {

    List<UserSkill> findByUserId(UUID userId);

    Optional<UserSkill> findByUserIdAndSkillIdAndRole(UUID userId, UUID skillId, UserSkillRole role);
}