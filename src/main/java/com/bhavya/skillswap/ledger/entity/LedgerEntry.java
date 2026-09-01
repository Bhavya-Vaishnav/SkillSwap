package com.bhavya.skillswap.ledger.entity;

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
@Table(name = "ledger_entries")
@Getter
@Setter
@NoArgsConstructor
public class LedgerEntry {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "txn_group_id", nullable = false)
    private UUID txnGroupId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "entry_type", nullable = false, columnDefinition = "ledger_entry_type")
    private LedgerEntryType entryType;

    @Column(name = "reference_id")
    private UUID referenceId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public LedgerEntry(UUID txnGroupId, UUID userId, BigDecimal amount,
                       LedgerEntryType entryType, UUID referenceId) {
        this.txnGroupId = txnGroupId;
        this.userId = userId;
        this.amount = amount;
        this.entryType = entryType;
        this.referenceId = referenceId;
    }
}