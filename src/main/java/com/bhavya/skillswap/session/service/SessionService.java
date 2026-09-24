package com.bhavya.skillswap.session.service;

import com.bhavya.skillswap.common.ai.PriceSuggestionService;
import com.bhavya.skillswap.common.exception.InvalidSessionTransitionException;
import com.bhavya.skillswap.common.exception.ResourceNotFoundException;
import com.bhavya.skillswap.common.exception.UnauthorizedActionException;
import com.bhavya.skillswap.ledger.entity.LedgerEntryType;
import com.bhavya.skillswap.ledger.service.LedgerService;
import com.bhavya.skillswap.session.dto.AcceptSessionRequest;
import com.bhavya.skillswap.session.dto.PriceSuggestionResponse;
import com.bhavya.skillswap.session.dto.SessionRequest;
import com.bhavya.skillswap.session.dto.SessionResponse;
import com.bhavya.skillswap.session.entity.Session;
import com.bhavya.skillswap.session.entity.SessionStatus;
import com.bhavya.skillswap.session.repository.SessionRepository;
import com.bhavya.skillswap.user.entity.User;
import com.bhavya.skillswap.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final SessionRepository sessionRepository;
    private final LedgerService ledgerService;
    private final PriceSuggestionService priceSuggestionService;
    private final UserRepository userRepository;

    @Caching(evict = {
            @CacheEvict(value = "userSessions", key = "#result.requesterId"),
            @CacheEvict(value = "userSessions", key = "#result.providerId")
    })
    @Transactional
    public SessionResponse requestSession(UUID requesterId, SessionRequest req) {
        Session session = new Session(requesterId, req.providerId(), req.skillId(), req.creditAmount());
        Session saved = sessionRepository.save(session);
        return toResponse(saved);
    }

    @Caching(evict = {
            @CacheEvict(value = "userSessions", key = "#result.requesterId"),
            @CacheEvict(value = "userSessions", key = "#result.providerId")
    })
    @Transactional
    public SessionResponse acceptSession(UUID actingUserId, UUID sessionId, AcceptSessionRequest req) {
        Session session = lockSession(sessionId);
        if (session.getStatus() != SessionStatus.REQUESTED) {
            throw new InvalidSessionTransitionException("Cannot accept session in status " + session.getStatus());
        }
        requireProvider(session, actingUserId);
        session.setStatus(SessionStatus.ACCEPTED);
        session.setMeetingLink(req.meetingLink());
        session.setUpdatedAt(java.time.Instant.now());
        return toResponse(sessionRepository.save(session));
    }

    @Caching(evict = {
            @CacheEvict(value = "userSessions", key = "#result.requesterId"),
            @CacheEvict(value = "userSessions", key = "#result.providerId")
    })
    @Transactional
    public SessionResponse rejectSession(UUID actingUserId, UUID sessionId) {
        Session session = lockSession(sessionId);
        if (session.getStatus() != SessionStatus.REQUESTED) {
            throw new InvalidSessionTransitionException("Cannot reject session in status " + session.getStatus());
        }
        requireProvider(session, actingUserId);
        session.setStatus(SessionStatus.REJECTED);
        session.setUpdatedAt(java.time.Instant.now());
        return toResponse(sessionRepository.save(session));
    }

    @Caching(evict = {
            @CacheEvict(value = "userSessions", key = "#result.requesterId"),
            @CacheEvict(value = "userSessions", key = "#result.providerId")
    })
    @Transactional
    public SessionResponse cancelSession(UUID actingUserId, UUID sessionId) {
        Session session = lockSession(sessionId);
        if (session.getStatus() != SessionStatus.REQUESTED && session.getStatus() != SessionStatus.ACCEPTED) {
            throw new InvalidSessionTransitionException("Cannot cancel session in status " + session.getStatus());
        }
        requireParticipant(session, actingUserId);
        session.setStatus(SessionStatus.CANCELLED);
        session.setUpdatedAt(java.time.Instant.now());
        return toResponse(sessionRepository.save(session));
    }

    @Caching(evict = {
            @CacheEvict(value = "userSessions", key = "#result.requesterId"),
            @CacheEvict(value = "userSessions", key = "#result.providerId")
    })
    @Transactional
    public SessionResponse disputeSession(UUID actingUserId, UUID sessionId) {
        Session session = lockSession(sessionId);
        if (session.getStatus() != SessionStatus.ACCEPTED) {
            throw new InvalidSessionTransitionException("Cannot dispute session in status " + session.getStatus());
        }
        requireParticipant(session, actingUserId);
        session.setStatus(SessionStatus.DISPUTED);
        session.setUpdatedAt(java.time.Instant.now());
        return toResponse(sessionRepository.save(session));
    }

    /**
     * Requester confirms the session happened -> releases payment to provider.
     * Ledger transfer + status update happen in the same transaction: if the
     * transfer fails (e.g. insufficient balance), the whole thing rolls back
     * and the session stays ACCEPTED.
     */
    @Caching(evict = {
            @CacheEvict(value = "userSessions", key = "#result.requesterId"),
            @CacheEvict(value = "userSessions", key = "#result.providerId"),
            @CacheEvict(value = "pricingStats", allEntries = true)
    })
    @Transactional
    public SessionResponse completeSession(UUID actingUserId, UUID sessionId) {
        Session session = lockSession(sessionId);

        if (session.getStatus() != SessionStatus.ACCEPTED) {
            throw new InvalidSessionTransitionException(
                    "Cannot complete session in status " + session.getStatus());
        }

        if (!session.getRequesterId().equals(actingUserId)) {
            throw new UnauthorizedActionException("Only the requester can mark a session complete");
        }

        ledgerService.transferCredits(
                session.getRequesterId(), session.getProviderId(), session.getCreditAmount(),
                LedgerEntryType.SESSION_PAYMENT, session.getId());

        session.setStatus(SessionStatus.COMPLETED);
        session.setUpdatedAt(java.time.Instant.now());
        return toResponse(sessionRepository.save(session));
    }

    @Cacheable(value = "userSessions", key = "#userId")
    public List<SessionResponse> getMySessions(UUID userId) {
        return sessionRepository.findByRequesterIdOrProviderIdOrderByCreatedAtDesc(userId, userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public PriceSuggestionResponse suggestPrice(String skillName) {
        return priceSuggestionService.suggestPrice(skillName);
    }

    private Session lockSession(UUID sessionId) {
        return sessionRepository.findByIdForUpdate(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionId));
    }

    private void requireProvider(Session session, UUID actingUserId) {
        if (!session.getProviderId().equals(actingUserId)) {
            throw new UnauthorizedActionException("Only the provider can perform this action");
        }
    }

    private void requireParticipant(Session session, UUID actingUserId) {
        if (!session.getRequesterId().equals(actingUserId) && !session.getProviderId().equals(actingUserId)) {
            throw new UnauthorizedActionException("Only session participants can perform this action");
        }
    }

    private SessionResponse toResponse(Session s) {
        boolean contactVisible = s.getStatus() != SessionStatus.REQUESTED;

        User requester = userRepository.findById(s.getRequesterId()).orElse(null);
        User provider = userRepository.findById(s.getProviderId()).orElse(null);

        String requesterName = requester != null ? requester.getDisplayName() : null;
        String providerName = provider != null ? provider.getDisplayName() : null;
        String requesterEmail = contactVisible && requester != null ? requester.getEmail() : null;
        String providerEmail = contactVisible && provider != null ? provider.getEmail() : null;

        return new SessionResponse(s.getId(), s.getRequesterId(), requesterName, requesterEmail,
                s.getProviderId(), providerName, providerEmail, s.getSkillId(),
                s.getCreditAmount(), s.getStatus(), s.getMeetingLink(),
                s.getCreatedAt(), s.getUpdatedAt());
    }
}