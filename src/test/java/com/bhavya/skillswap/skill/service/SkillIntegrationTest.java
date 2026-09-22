package com.bhavya.skillswap.skill.service;

import com.bhavya.skillswap.common.BaseIntegrationTest;
import com.bhavya.skillswap.skill.entity.Skill;
import com.bhavya.skillswap.skill.repository.SkillRepository;
import com.bhavya.skillswap.user.entity.User;
import com.bhavya.skillswap.user.repository.UserRepository;
import com.bhavya.skillswap.userskill.entity.ProficiencyLevel;
import com.bhavya.skillswap.userskill.entity.UserSkill;
import com.bhavya.skillswap.userskill.entity.UserSkillRole;
import com.bhavya.skillswap.userskill.repository.UserSkillRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SkillIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private SkillService skillService;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserSkillRepository userSkillRepository;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = userRepository.save(new User(
                "skill-test-" + UUID.randomUUID() + "@test.com",
                encoder.encode("password"),
                "SkillTestUser"
        ));
    }

    @AfterEach
    void tearDown() {
        userSkillRepository.deleteAll();
        skillRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("getOrCreateSkill handles case-insensitivity and whitespace without creating duplicate skills")
    void getOrCreateSkill_caseInsensitiveDeduplication_returnsExistingSkill() {
        String baseName = "PostgreSQL-" + UUID.randomUUID().toString().substring(0, 6);

        Skill first = skillService.getOrCreateSkill(baseName, "Databases");
        Skill second = skillService.getOrCreateSkill(baseName.toLowerCase(), "Databases");
        Skill third = skillService.getOrCreateSkill("  " + baseName.toUpperCase() + "  ", "Databases");

        assertThat(first.getId()).isNotNull();
        assertThat(second.getId()).isEqualTo(first.getId());
        assertThat(third.getId()).isEqualTo(first.getId());
    }

    @Test
    @DisplayName("Database unique constraint skills_name_key rejects duplicate skill names")
    void uniqueSkillNameConstraint_enforcedAtDatabaseLevel() {
        String skillName = "UniqueSkill-" + UUID.randomUUID();
        skillRepository.saveAndFlush(new Skill(skillName, "Category"));

        Skill duplicate = new Skill(skillName, "DifferentCategory");
        assertThatThrownBy(() -> skillRepository.saveAndFlush(duplicate))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("skills_name_key");
    }

    @Test
    @DisplayName("Database composite unique constraint (user_id, skill_id, role) rejects duplicate user skills")
    void userSkillsCompositeUniqueConstraint_enforcedAtDatabaseLevel() {
        Skill skill = skillRepository.save(new Skill("CompositeSkill-" + UUID.randomUUID(), "Programming"));

        // First mapping: OFFERED
        UserSkill offeredSkill = new UserSkill(
                testUser.getId(),
                skill.getId(),
                UserSkillRole.OFFERED,
                ProficiencyLevel.INTERMEDIATE
        );
        userSkillRepository.saveAndFlush(offeredSkill);

        // Duplicate mapping with same user, skill, and role (even with different proficiency)
        UserSkill duplicateOffered = new UserSkill(
                testUser.getId(),
                skill.getId(),
                UserSkillRole.OFFERED,
                ProficiencyLevel.ADVANCED
        );
        assertThatThrownBy(() -> userSkillRepository.saveAndFlush(duplicateOffered))
                .isInstanceOf(DataIntegrityViolationException.class);

        // Different role (WANTED) for same user and skill is permitted
        UserSkill wantedSkill = new UserSkill(
                testUser.getId(),
                skill.getId(),
                UserSkillRole.WANTED,
                ProficiencyLevel.BEGINNER
        );
        UserSkill savedWanted = userSkillRepository.saveAndFlush(wantedSkill);
        assertThat(savedWanted.getId()).isNotNull();
    }

    @Test
    @DisplayName("PostgreSQL foreign key ON DELETE CASCADE automatically deletes user_skills when user is deleted")
    void foreignKeyCascadeDelete_userDeletion_cascadesToUserSkills() {
        Skill skill = skillRepository.save(new Skill("CascadeSkill-" + UUID.randomUUID(), "Design"));

        UserSkill userSkill = new UserSkill(
                testUser.getId(),
                skill.getId(),
                UserSkillRole.OFFERED,
                ProficiencyLevel.EXPERT
        );
        userSkillRepository.saveAndFlush(userSkill);

        List<UserSkill> beforeDelete = userSkillRepository.findByUserId(testUser.getId());
        assertThat(beforeDelete).hasSize(1);

        // Delete user directly
        userRepository.deleteById(testUser.getId());
        userRepository.flush();

        // Foreign key ON DELETE CASCADE removes user_skills at the database level
        List<UserSkill> afterDelete = userSkillRepository.findByUserId(testUser.getId());
        assertThat(afterDelete).isEmpty();
    }
}
