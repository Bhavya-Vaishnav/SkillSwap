package com.bhavya.skillswap.ledger.service;

import com.bhavya.skillswap.common.exception.InsufficientBalanceException;
import com.bhavya.skillswap.ledger.entity.LedgerEntryType;
import com.bhavya.skillswap.user.entity.User;
import com.bhavya.skillswap.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class LedgerConcurrencyTest {

    @Autowired
    private LedgerService ledgerService;
    @Autowired
    private UserRepository userRepository;

    private UUID senderId;
    private UUID receiverAId;
    private UUID receiverBId;

    @BeforeEach
    void setUp() {
        var encoder = new BCryptPasswordEncoder();

        User sender = new User("sender1@test.com", encoder.encode("pw"), "Sender");
        User receiverA = new User("recva1@test.com", encoder.encode("pw"), "ReceiverA");
        User receiverB = new User("recvb1@test.com", encoder.encode("pw"), "ReceiverB");

        senderId = userRepository.save(sender).getId();
        receiverAId = userRepository.save(receiverA).getId();
        receiverBId = userRepository.save(receiverB).getId();

        // fund sender with exactly 10 credits via direct transfer setup isn't available yet
        // (no signup bonus wired to this user) -> use ledgerService's internal grant if exposed,
        // else insert directly via ledgerEntryRepository in a @BeforeEach helper.
        ledgerService.grantSignupBonus(senderId, new BigDecimal("10.00"));
    }

    @Test
    void concurrentTransfers_onlyOneSucceeds_balanceNeverNegative() throws InterruptedException {
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch latch = new CountDownLatch(2);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);

        Runnable task1 = () -> {
            try {
                ledgerService.transferCredits(senderId, receiverAId, new BigDecimal("10.00"),
                        LedgerEntryType.SESSION_PAYMENT, null);
                successCount.incrementAndGet();
            } catch (InsufficientBalanceException e) {
                failCount.incrementAndGet();
            } finally {
                latch.countDown();
            }
        };

        Runnable task2 = () -> {
            try {
                ledgerService.transferCredits(senderId, receiverBId, new BigDecimal("10.00"),
                        LedgerEntryType.SESSION_PAYMENT, null);
                successCount.incrementAndGet();
            } catch (InsufficientBalanceException e) {
                failCount.incrementAndGet();
            } finally {
                latch.countDown();
            }
        };

        executor.submit(task1);
        executor.submit(task2);

        latch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(successCount.get()).isEqualTo(1);
        assertThat(failCount.get()).isEqualTo(1);
        assertThat(ledgerService.getBalance(senderId)).isGreaterThanOrEqualTo(BigDecimal.ZERO);
    }
}