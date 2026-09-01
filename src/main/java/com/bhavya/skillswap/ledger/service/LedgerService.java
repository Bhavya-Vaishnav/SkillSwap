package com.bhavya.skillswap.ledger.service;

import com.bhavya.skillswap.common.exception.InsufficientBalanceException;
import com.bhavya.skillswap.common.exception.ResourceNotFoundException;
import com.bhavya.skillswap.ledger.entity.LedgerEntry;
import com.bhavya.skillswap.ledger.entity.LedgerEntryType;
import com.bhavya.skillswap.ledger.repository.LedgerEntryRepository;
import com.bhavya.skillswap.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LedgerService {

    private final LedgerEntryRepository ledgerEntryRepository;
    private final UserRepository userRepository;

    @Transactional
    public void transferCredits(UUID fromUserId, UUID toUserId, BigDecimal amount,
                                LedgerEntryType entryType, UUID referenceId) {

        if (fromUserId.equals(toUserId)) {
            throw new IllegalArgumentException("Cannot transfer credits to self");
        }

        // Lock ordering to prevent deadlock: always lock lower UUID string first
        UUID first = fromUserId.toString().compareTo(toUserId.toString()) < 0 ? fromUserId : toUserId;
        UUID second = first.equals(fromUserId) ? toUserId : fromUserId;

        userRepository.findByIdForUpdate(first)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + first));
        userRepository.findByIdForUpdate(second)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + second));

        // Both rows locked now — safe to read balance, no concurrent writer can interleave
        BigDecimal senderBalance = ledgerEntryRepository.getBalance(fromUserId);
        if (senderBalance.compareTo(amount) < 0) {
            throw new InsufficientBalanceException(
                    "Insufficient balance: have " + senderBalance + ", need " + amount);
        }

        UUID txnGroupId = UUID.randomUUID();

        LedgerEntry debit = new LedgerEntry(txnGroupId, fromUserId, amount.negate(), entryType, referenceId);
        LedgerEntry credit = new LedgerEntry(txnGroupId, toUserId, amount, entryType, referenceId);

        ledgerEntryRepository.save(debit);
        ledgerEntryRepository.save(credit);
        // locks released on transaction commit
    }

    public BigDecimal getBalance(UUID userId) {
        return ledgerEntryRepository.getBalance(userId);
    }

    @Transactional
    public void grantSignupBonus(UUID userId, BigDecimal amount) {
        UUID txnGroupId = UUID.randomUUID();
        LedgerEntry credit = new LedgerEntry(txnGroupId, userId, amount, LedgerEntryType.SIGNUP_BONUS, null);
        ledgerEntryRepository.save(credit);
        // one-sided entry — no debit needed, this is credits entering the system
        // NOTE: breaks strict double-entry (sum != 0 for this txn_group). Flag this
        // in interview as intentional: signup bonus = system-issued credit, not a
        // transfer between users. If you want strict double-entry, add a "SYSTEM" user.
    }
}