package com.bhavya.skillswap.ledger.service;

import com.bhavya.skillswap.common.BaseIntegrationTest;
import com.bhavya.skillswap.common.exception.InsufficientBalanceException;
import com.bhavya.skillswap.ledger.entity.LedgerEntry;
import com.bhavya.skillswap.ledger.entity.LedgerEntryType;
import com.bhavya.skillswap.ledger.repository.LedgerEntryRepository;
import com.bhavya.skillswap.user.entity.User;
import com.bhavya.skillswap.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LedgerIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private LedgerService ledgerService;

    @Autowired
    private LedgerEntryRepository ledgerEntryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    private User sender;
    private User receiverA;
    private User receiverB;

    @BeforeEach
    void setUp() {
        sender = userRepository.save(new User(
                "ledger-sender-" + UUID.randomUUID() + "@test.com",
                encoder.encode("password"),
                "LedgerSender"
        ));
        receiverA = userRepository.save(new User(
                "ledger-recva-" + UUID.randomUUID() + "@test.com",
                encoder.encode("password"),
                "LedgerReceiverA"
        ));
        receiverB = userRepository.save(new User(
                "ledger-recvb-" + UUID.randomUUID() + "@test.com",
                encoder.encode("password"),
                "LedgerReceiverB"
        ));
    }

    @AfterEach
    void tearDown() {
        ledgerEntryRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Pessimistic locking prevents balance overdraft under concurrent transfer contention")
    void concurrentTransfers_pessimisticLocking_preventsOverdraft() throws InterruptedException {
        // Fund sender with exactly 10.00 credits
        ledgerService.grantSignupBonus(sender.getId(), new BigDecimal("10.00"));

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch finishLatch = new CountDownLatch(2);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        // Thread 1 attempts to transfer all 10 credits to receiverA
        executor.submit(() -> {
            try {
                startLatch.await();
                ledgerService.transferCredits(
                        sender.getId(), receiverA.getId(),
                        new BigDecimal("10.00"),
                        LedgerEntryType.SESSION_PAYMENT,
                        null
                );
                successCount.incrementAndGet();
            } catch (InsufficientBalanceException e) {
                failureCount.incrementAndGet();
            } catch (Exception ignored) {
            } finally {
                finishLatch.countDown();
            }
        });

        // Thread 2 simultaneously attempts to transfer all 10 credits to receiverB
        executor.submit(() -> {
            try {
                startLatch.await();
                ledgerService.transferCredits(
                        sender.getId(), receiverB.getId(),
                        new BigDecimal("10.00"),
                        LedgerEntryType.SESSION_PAYMENT,
                        null
                );
                successCount.incrementAndGet();
            } catch (InsufficientBalanceException e) {
                failureCount.incrementAndGet();
            } catch (Exception ignored) {
            } finally {
                finishLatch.countDown();
            }
        });

        // Fire both threads simultaneously
        startLatch.countDown();
        finishLatch.await();
        executor.shutdown();

        // Exactly one transfer must succeed, and one must fail due to row-level locking
        assertThat(successCount.get()).isEqualTo(1);
        assertThat(failureCount.get()).isEqualTo(1);

        // Final balances: sender must have exactly 0.00 credits, never negative
        BigDecimal finalSenderBalance = ledgerService.getBalance(sender.getId());
        assertThat(finalSenderBalance).isEqualByComparingTo("0.00");

        BigDecimal totalReceiverBalance = ledgerService.getBalance(receiverA.getId())
                .add(ledgerService.getBalance(receiverB.getId()));
        assertThat(totalReceiverBalance).isEqualByComparingTo("10.00");
    }

    @Test
    @DisplayName("Credit transfer creates balanced double-entry with matching txn_group_id")
    void transferCredits_createsBalancedDoubleEntry() {
        ledgerService.grantSignupBonus(sender.getId(), new BigDecimal("50.00"));

        UUID referenceId = UUID.randomUUID();
        ledgerService.transferCredits(
                sender.getId(), receiverA.getId(),
                new BigDecimal("20.00"),
                LedgerEntryType.SESSION_PAYMENT,
                referenceId
        );

        List<LedgerEntry> entries = ledgerEntryRepository.findByUserIdOrderByCreatedAtDesc(sender.getId());
        // Find debit entry corresponding to the transfer
        LedgerEntry debitEntry = entries.stream()
                .filter(e -> e.getEntryType() == LedgerEntryType.SESSION_PAYMENT)
                .findFirst()
                .orElseThrow();

        assertThat(debitEntry.getAmount()).isEqualByComparingTo("-20.00");
        assertThat(debitEntry.getReferenceId()).isEqualTo(referenceId);

        // Find matching credit entry for receiver with the exact same txn_group_id
        List<LedgerEntry> receiverEntries = ledgerEntryRepository.findByUserIdOrderByCreatedAtDesc(receiverA.getId());
        LedgerEntry creditEntry = receiverEntries.stream()
                .filter(e -> e.getTxnGroupId().equals(debitEntry.getTxnGroupId()))
                .findFirst()
                .orElseThrow();

        assertThat(creditEntry.getAmount()).isEqualByComparingTo("20.00");
        assertThat(creditEntry.getReferenceId()).isEqualTo(referenceId);

        // Verify zero-sum double-entry invariant: debit + credit == 0
        assertThat(debitEntry.getAmount().add(creditEntry.getAmount())).isEqualByComparingTo("0.00");
    }

    @Test
    @DisplayName("Database check constraint amount_nonzero rejects zero-amount ledger entries")
    void amountNonzero_databaseCheckConstraint_enforced() {
        LedgerEntry zeroEntry = new LedgerEntry(
                UUID.randomUUID(),
                sender.getId(),
                BigDecimal.ZERO,
                LedgerEntryType.ADJUSTMENT,
                null
        );

        assertThatThrownBy(() -> ledgerEntryRepository.saveAndFlush(zeroEntry))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("amount_nonzero");
    }

    @Test
    @DisplayName("PostgreSQL view user_balances correctly aggregates net balances")
    void userBalancesView_matchesCalculatedBalance() {
        ledgerService.grantSignupBonus(sender.getId(), new BigDecimal("100.00"));
        ledgerService.transferCredits(
                sender.getId(), receiverA.getId(),
                new BigDecimal("35.50"),
                LedgerEntryType.SESSION_PAYMENT,
                null
        );

        // Query the real PostgreSQL view defined in V1 migration
        BigDecimal senderViewBalance = jdbcTemplate.queryForObject(
                "SELECT balance FROM user_balances WHERE user_id = ?",
                BigDecimal.class,
                sender.getId()
        );

        BigDecimal receiverViewBalance = jdbcTemplate.queryForObject(
                "SELECT balance FROM user_balances WHERE user_id = ?",
                BigDecimal.class,
                receiverA.getId()
        );

        assertThat(senderViewBalance).isEqualByComparingTo("64.50");
        assertThat(receiverViewBalance).isEqualByComparingTo("35.50");
        assertThat(senderViewBalance).isEqualByComparingTo(ledgerService.getBalance(sender.getId()));
        assertThat(receiverViewBalance).isEqualByComparingTo(ledgerService.getBalance(receiverA.getId()));
    }
}
