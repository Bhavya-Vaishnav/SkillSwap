package com.bhavya.skillswap.session.service;

import com.bhavya.skillswap.common.exception.InvalidSessionTransitionException;
import com.bhavya.skillswap.common.exception.ResourceNotFoundException;
import com.bhavya.skillswap.common.exception.UnauthorizedActionException;
import com.bhavya.skillswap.ledger.entity.LedgerEntryType;
import com.bhavya.skillswap.ledger.service.LedgerService;
import com.bhavya.skillswap.session.dto.SessionRequest;
import com.bhavya.skillswap.session.entity.Session;
import com.bhavya.skillswap.session.entity.SessionStatus;
import com.bhavya.skillswap.session.repository.SessionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionServiceTest {

    @Mock
    private SessionRepository sessionRepository;
    @Mock
    private LedgerService ledgerService;

    @InjectMocks
    private SessionService sessionService;

    private UUID requesterId;
    private UUID providerId;
    private UUID skillId;
    private UUID sessionId;

    private Session buildSession(SessionStatus status) {
        Session s = new Session(requesterId, providerId, skillId, new BigDecimal("10.00"));
        s.setId(sessionId);
        s.setStatus(status);
        return s;
    }

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        requesterId = UUID.randomUUID();
        providerId = UUID.randomUUID();
        skillId = UUID.randomUUID();
        sessionId = UUID.randomUUID();
    }

    @Test
    void requestSession_createsWithStatusRequested() {
        Session saved = buildSession(SessionStatus.REQUESTED);
        when(sessionRepository.save(any())).thenReturn(saved);

        var req = new SessionRequest(providerId, skillId, new BigDecimal("10.00"));
        var result = sessionService.requestSession(requesterId, req);

        assertThat(result.status()).isEqualTo(SessionStatus.REQUESTED);
    }

    @Test
    void acceptSession_byProvider_succeeds() {
        Session session = buildSession(SessionStatus.REQUESTED);
        when(sessionRepository.findByIdForUpdate(sessionId)).thenReturn(Optional.of(session));
        when(sessionRepository.save(any())).thenReturn(session);

        var result = sessionService.acceptSession(providerId, sessionId);

        assertThat(result.status()).isEqualTo(SessionStatus.ACCEPTED);
    }

    @Test
    void acceptSession_byRequester_throwsUnauthorized() {
        Session session = buildSession(SessionStatus.REQUESTED);
        when(sessionRepository.findByIdForUpdate(sessionId)).thenReturn(Optional.of(session));

        assertThatThrownBy(() -> sessionService.acceptSession(requesterId, sessionId))
                .isInstanceOf(UnauthorizedActionException.class);

        verify(sessionRepository, never()).save(any());
    }

    @Test
    void acceptSession_wrongStatus_throwsInvalidTransition() {
        Session session = buildSession(SessionStatus.ACCEPTED); // already accepted
        when(sessionRepository.findByIdForUpdate(sessionId)).thenReturn(Optional.of(session));

        assertThatThrownBy(() -> sessionService.acceptSession(providerId, sessionId))
                .isInstanceOf(InvalidSessionTransitionException.class);

        verify(sessionRepository, never()).save(any());
    }

    @Test
    void completeSession_beforeAccept_throwsInvalidTransition() {
        Session session = buildSession(SessionStatus.REQUESTED);
        when(sessionRepository.findByIdForUpdate(sessionId)).thenReturn(Optional.of(session));

        assertThatThrownBy(() -> sessionService.completeSession(requesterId, sessionId))
                .isInstanceOf(InvalidSessionTransitionException.class);

        verify(ledgerService, never()).transferCredits(any(), any(), any(), any(), any());
        verify(sessionRepository, never()).save(any());
    }

    @Test
    void completeSession_calledTwice_secondCallThrows() {
        Session session = buildSession(SessionStatus.COMPLETED); // already completed
        when(sessionRepository.findByIdForUpdate(sessionId)).thenReturn(Optional.of(session));

        assertThatThrownBy(() -> sessionService.completeSession(requesterId, sessionId))
                .isInstanceOf(InvalidSessionTransitionException.class);

        verify(ledgerService, never()).transferCredits(any(), any(), any(), any(), any());
    }

    @Test
    void completeSession_byNonRequester_throwsUnauthorized() {
        Session session = buildSession(SessionStatus.ACCEPTED);
        when(sessionRepository.findByIdForUpdate(sessionId)).thenReturn(Optional.of(session));

        assertThatThrownBy(() -> sessionService.completeSession(providerId, sessionId))
                .isInstanceOf(UnauthorizedActionException.class);

        verify(ledgerService, never()).transferCredits(any(), any(), any(), any(), any());
    }

    @Test
    void completeSession_validFlow_transfersCreditsAndUpdatesStatus() {
        Session session = buildSession(SessionStatus.ACCEPTED);
        when(sessionRepository.findByIdForUpdate(sessionId)).thenReturn(Optional.of(session));
        when(sessionRepository.save(any())).thenReturn(session);

        var result = sessionService.completeSession(requesterId, sessionId);

        verify(ledgerService).transferCredits(requesterId, providerId, new BigDecimal("10.00"),
                LedgerEntryType.SESSION_PAYMENT, sessionId);
        assertThat(result.status()).isEqualTo(SessionStatus.COMPLETED);
    }

    @Test
    void rejectSession_byProvider_succeeds() {
        Session session = buildSession(SessionStatus.REQUESTED);
        when(sessionRepository.findByIdForUpdate(sessionId)).thenReturn(Optional.of(session));
        when(sessionRepository.save(any())).thenReturn(session);

        var result = sessionService.rejectSession(providerId, sessionId);

        assertThat(result.status()).isEqualTo(SessionStatus.REJECTED);
    }

    @Test
    void cancelSession_byEitherParty_succeeds() {
        Session session = buildSession(SessionStatus.REQUESTED);
        when(sessionRepository.findByIdForUpdate(sessionId)).thenReturn(Optional.of(session));
        when(sessionRepository.save(any())).thenReturn(session);

        var result = sessionService.cancelSession(requesterId, sessionId);

        assertThat(result.status()).isEqualTo(SessionStatus.CANCELLED);
    }

    @Test
    void cancelSession_byNonParticipant_throwsUnauthorized() {
        Session session = buildSession(SessionStatus.REQUESTED);
        when(sessionRepository.findByIdForUpdate(sessionId)).thenReturn(Optional.of(session));

        UUID randomUser = UUID.randomUUID();

        assertThatThrownBy(() -> sessionService.cancelSession(randomUser, sessionId))
                .isInstanceOf(UnauthorizedActionException.class);
    }

    @Test
    void disputeSession_onAcceptedSession_succeeds() {
        Session session = buildSession(SessionStatus.ACCEPTED);
        when(sessionRepository.findByIdForUpdate(sessionId)).thenReturn(Optional.of(session));
        when(sessionRepository.save(any())).thenReturn(session);

        var result = sessionService.disputeSession(providerId, sessionId);

        assertThat(result.status()).isEqualTo(SessionStatus.DISPUTED);
    }

    @Test
    void sessionNotFound_throwsResourceNotFound() {
        when(sessionRepository.findByIdForUpdate(sessionId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> sessionService.acceptSession(providerId, sessionId))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}