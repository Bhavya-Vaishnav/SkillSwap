package com.bhavya.skillswap.userskill.repository;

import com.bhavya.skillswap.userskill.entity.UserSkill;
import com.bhavya.skillswap.userskill.entity.UserSkillRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserSkillRepository extends JpaRepository<UserSkill, UUID> {

    List<UserSkill> findByUserId(UUID userId);

    @Query(value = """
            SELECT us.user_id FROM user_skills us
            JOIN skills sk ON us.skill_id = sk.id
            WHERE LOWER(sk.name) = LOWER(:skillName)
            AND us.role = CAST(:role AS skill_role)
            """, nativeQuery = true)
    List<UUID> findUserIdsBySkillNameAndRole(@Param("skillName") String skillName,
                                             @Param("role") String role);

    Optional<UserSkill> findByIdAndUserId(UUID id, UUID userId);
}