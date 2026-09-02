package com.bhavya.skillswap.session.service;

import com.bhavya.skillswap.session.entity.Session;
import com.bhavya.skillswap.session.entity.SessionStatus;
import com.bhavya.skillswap.session.repository.SessionRepository;
import com.bhavya.skillswap.user.entity.User;
import com.bhavya.skillswap.user.repository.UserRepository;
import com.bhavya.skillswap.skill.entity.Skill;
import com.bhavya.skillswap.skill.repository.SkillRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Proves the DB-level trigger blocks illegal transitions even when called
 * directly via repository, bypassing SessionService's app-level checks entirely.
 * This is the "defense in depth" proof for the resume bullet.
 */
@SpringBootTest
class SessionTriggerTest {

    @Autowired
    private SessionRepository sessionRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private SkillRepository skillRepository;

    private UUID requesterId;
    private UUID providerId;
    private UUID skillId;

    @BeforeEach
    void setUp() {
        var encoder = new BCryptPasswordEncoder();

        User requester = new User(
                "trigger-req-" + UUID.randomUUID() + "@test.com",
                encoder.encode("pw"),
                "TriggerReq"
        );

        User savedRequester = userRepository.saveAndFlush(requester);
        requesterId = savedRequester.getId();


        User provider = new User(
                "trigger-prov-" + UUID.randomUUID() + "@test.com",
                encoder.encode("pw"),
                "TriggerProv"
        );

        User savedProvider = userRepository.saveAndFlush(provider);
        providerId = savedProvider.getId();


        Skill skill = new Skill(
                "TriggerTestSkill-" + UUID.randomUUID(),
                "Test"
        );

        Skill savedSkill = skillRepository.saveAndFlush(skill);
        skillId = savedSkill.getId();
    }

    @Test
    void directUpdate_requestedToCompleted_blockedByTrigger() {
        Session session = new Session(requesterId, providerId, skillId, new BigDecimal("5.00"));
        session = sessionRepository.save(session); // status = REQUESTED

        session.setStatus(SessionStatus.COMPLETED); // illegal jump

        Session finalSession = session;
        assertThatThrownBy(() -> {
            sessionRepository.save(finalSession);
            sessionRepository.flush(); // force the UPDATE to actually hit Postgres now
        }).isInstanceOf(RuntimeException.class); // trigger raises exception, Spring wraps it
    }

    @Test
    void directUpdate_completedToRequested_blockedByTrigger() {
        Session session = new Session(requesterId, providerId, skillId, new BigDecimal("5.00"));
        session.setStatus(SessionStatus.COMPLETED);
        session = sessionRepository.save(session);

        session.setStatus(SessionStatus.REQUESTED); // illegal reverse transition

        Session finalSession = session;
        assertThatThrownBy(() -> {
            sessionRepository.save(finalSession);
            sessionRepository.flush();
        }).isInstanceOf(RuntimeException.class);
    }

    @Test
    void directUpdate_requestedToAccepted_allowedByTrigger() {
        Session session = new Session(requesterId, providerId, skillId, new BigDecimal("5.00"));
        session = sessionRepository.save(session);

        session.setStatus(SessionStatus.ACCEPTED); // legal transition
        sessionRepository.save(session);
        sessionRepository.flush(); // should NOT throw
    }
}