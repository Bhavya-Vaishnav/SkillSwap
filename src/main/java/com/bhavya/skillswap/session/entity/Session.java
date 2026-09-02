package com.bhavya.skillswap.session.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "sessions")
@Getter
@Setter
@NoArgsConstructor
public class Session {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "requester_id", nullable = false)
    private UUID requesterId;

    @Column(name = "provider_id", nullable = false)
    private UUID providerId;

    @Column(name = "skill_id", nullable = false)
    private UUID skillId;

    @Column(name = "credit_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal creditAmount;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, name = "status", columnDefinition = "session_status")
    private SessionStatus status = SessionStatus.REQUESTED;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Session(UUID requesterId, UUID providerId, UUID skillId, BigDecimal creditAmount) {
        this.requesterId = requesterId;
        this.providerId = providerId;
        this.skillId = skillId;
        this.creditAmount = creditAmount;
    }
}