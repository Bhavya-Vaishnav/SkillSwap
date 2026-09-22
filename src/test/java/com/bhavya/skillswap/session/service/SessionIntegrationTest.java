package com.bhavya.skillswap.session.service;

import com.bhavya.skillswap.common.BaseIntegrationTest;
import com.bhavya.skillswap.common.exception.InsufficientBalanceException;
import com.bhavya.skillswap.ledger.repository.LedgerEntryRepository;
import com.bhavya.skillswap.ledger.service.LedgerService;
import com.bhavya.skillswap.session.entity.Session;
import com.bhavya.skillswap.session.entity.SessionStatus;
import com.bhavya.skillswap.session.repository.SessionRepository;
import com.bhavya.skillswap.skill.entity.Skill;
import com.bhavya.skillswap.skill.repository.SkillRepository;
import com.bhavya.skillswap.user.entity.User;
import com.bhavya.skillswap.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SessionIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private SessionService sessionService;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private LedgerService ledgerService;

    @Autowired
    private LedgerEntryRepository ledgerEntryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SkillRepository skillRepository;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    private User requester;
    private User provider;
    private Skill skill;

    @BeforeEach
    void setUp() {
        requester = userRepository.save(new User(
                "session-req-" + UUID.randomUUID() + "@test.com",
                encoder.encode("password"),
                "SessionRequester"
        ));
        provider = userRepository.save(new User(
                "session-prov-" + UUID.randomUUID() + "@test.com",
                encoder.encode("password"),
                "SessionProvider"
        ));
        skill = skillRepository.save(new Skill(
                "Skill-" + UUID.randomUUID(),
                "Programming"
        ));
    }

    @AfterEach
    void tearDown() {
        sessionRepository.deleteAll();
        ledgerEntryRepository.deleteAll();
        skillRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("PostgreSQL trigger trg_validate_session_transition blocks illegal transition from REQUESTED to COMPLETED")
    void validateSessionTransition_dbTrigger_blocksIllegalJump() {
        Session session = sessionRepository.saveAndFlush(
                new Session(requester.getId(), provider.getId(), skill.getId(), new BigDecimal("15.00"))
        );

        // Attempt illegal direct jump from REQUESTED to COMPLETED without going through ACCEPTED
        session.setStatus(SessionStatus.COMPLETED);

        assertThatThrownBy(() -> sessionRepository.saveAndFlush(session))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid session state transition: REQUESTED -> COMPLETED");
    }

    @Test
    @DisplayName("PostgreSQL trigger blocks illegal reverse transition from COMPLETED to REQUESTED")
    void validateSessionTransition_dbTrigger_blocksReverseTransition() {
        Session session = sessionRepository.saveAndFlush(
                new Session(requester.getId(), provider.getId(), skill.getId(), new BigDecimal("15.00"))
        );

        // Legal step 1: REQUESTED -> ACCEPTED
        session.setStatus(SessionStatus.ACCEPTED);
        session = sessionRepository.saveAndFlush(session);

        // Legal step 2: ACCEPTED -> COMPLETED
        session.setStatus(SessionStatus.COMPLETED);
        session = sessionRepository.saveAndFlush(session);

        // Illegal reverse step: COMPLETED -> REQUESTED
        session.setStatus(SessionStatus.REQUESTED);
        Session finalSession = session;

        assertThatThrownBy(() -> sessionRepository.saveAndFlush(finalSession))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid session state transition: COMPLETED -> REQUESTED");
    }

    @Test
    @DisplayName("Database check constraint no_self_session rejects session where requester equals provider")
    void noSelfSession_databaseCheckConstraint_enforced() {
        Session selfSession = new Session(
                requester.getId(), requester.getId(), skill.getId(), new BigDecimal("10.00")
        );

        assertThatThrownBy(() -> sessionRepository.saveAndFlush(selfSession))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("no_self_session");
    }

    @Test
    @DisplayName("Database check constraint rejects non-positive credit amounts")
    void creditAmountPositive_databaseCheckConstraint_enforced() {
        Session zeroCreditSession = new Session(
                requester.getId(), provider.getId(), skill.getId(), BigDecimal.ZERO
        );

        assertThatThrownBy(() -> sessionRepository.saveAndFlush(zeroCreditSession))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("sessions_credit_amount_check");
    }

    @Test
    @DisplayName("completeSession atomically rolls back session status if requester has insufficient balance")
    void completeSession_insufficientBalance_rollsBackTransactionAtomically() {
        // Requester has 0 balance
        Session session = sessionRepository.saveAndFlush(
                new Session(requester.getId(), provider.getId(), skill.getId(), new BigDecimal("50.00"))
        );
        session.setStatus(SessionStatus.ACCEPTED);
        session = sessionRepository.saveAndFlush(session);

        UUID sessionId = session.getId();

        // Attempting to complete must fail because requester has 0 credits (needs 50.00)
        assertThatThrownBy(() -> sessionService.completeSession(requester.getId(), sessionId))
                .isInstanceOf(InsufficientBalanceException.class);

        // Verify database state: status must remain ACCEPTED (not COMPLETED) due to atomic rollback
        Session refreshedSession = sessionRepository.findById(sessionId).orElseThrow();
        assertThat(refreshedSession.getStatus()).isEqualTo(SessionStatus.ACCEPTED);

        // Verify zero ledger entries were written
        assertThat(ledgerEntryRepository.findByUserIdOrderByCreatedAtDesc(requester.getId())).isEmpty();
    }

    @Test
    @DisplayName("completeSession commits status update and ledger transfer together when balance is sufficient")
    void completeSession_sufficientBalance_commitsStatusAndLedgerAtomically() {
        // Fund requester with 100 credits
        ledgerService.grantSignupBonus(requester.getId(), new BigDecimal("100.00"));

        Session session = sessionRepository.saveAndFlush(
                new Session(requester.getId(), provider.getId(), skill.getId(), new BigDecimal("40.00"))
        );
        session.setStatus(SessionStatus.ACCEPTED);
        session = sessionRepository.saveAndFlush(session);

        // Complete session
        sessionService.completeSession(requester.getId(), session.getId());

        // Verify session status updated to COMPLETED in database
        Session refreshedSession = sessionRepository.findById(session.getId()).orElseThrow();
        assertThat(refreshedSession.getStatus()).isEqualTo(SessionStatus.COMPLETED);

        // Verify ledger entries were created and committed
        assertThat(ledgerService.getBalance(requester.getId())).isEqualByComparingTo("60.00");
        assertThat(ledgerService.getBalance(provider.getId())).isEqualByComparingTo("40.00");
    }
}
