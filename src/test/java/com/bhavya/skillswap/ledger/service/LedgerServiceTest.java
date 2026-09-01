package com.bhavya.skillswap.ledger.service;

import com.bhavya.skillswap.common.exception.InsufficientBalanceException;
import com.bhavya.skillswap.common.exception.ResourceNotFoundException;
import com.bhavya.skillswap.ledger.entity.LedgerEntryType;
import com.bhavya.skillswap.ledger.repository.LedgerEntryRepository;
import com.bhavya.skillswap.user.entity.User;
import com.bhavya.skillswap.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LedgerServiceTest {

    @Mock
    private LedgerEntryRepository ledgerEntryRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private LedgerService ledgerService;

    @Test
    void transfer_sufficientBalance_succeeds() {
        UUID fromId = UUID.randomUUID();
        UUID toId = UUID.randomUUID();

        when(userRepository.findByIdForUpdate(any())).thenReturn(Optional.of(new User()));
        when(ledgerEntryRepository.getBalance(fromId)).thenReturn(new BigDecimal("50.00"));

        ledgerService.transferCredits(fromId, toId, new BigDecimal("20.00"),
                LedgerEntryType.SESSION_PAYMENT, null);

        verify(ledgerEntryRepository, times(2)).save(any());
    }

    @Test
    void transfer_insufficientBalance_throwsException() {
        UUID fromId = UUID.randomUUID();
        UUID toId = UUID.randomUUID();

        when(userRepository.findByIdForUpdate(any())).thenReturn(Optional.of(new User()));
        when(ledgerEntryRepository.getBalance(fromId)).thenReturn(new BigDecimal("5.00"));

        assertThatThrownBy(() ->
                ledgerService.transferCredits(fromId, toId, new BigDecimal("20.00"),
                        LedgerEntryType.SESSION_PAYMENT, null))
                .isInstanceOf(InsufficientBalanceException.class);

        verify(ledgerEntryRepository, never()).save(any());
    }

    @Test
    void transfer_selfTransfer_throwsException() {
        UUID userId = UUID.randomUUID();

        assertThatThrownBy(() ->
                ledgerService.transferCredits(userId, userId, new BigDecimal("10.00"),
                        LedgerEntryType.SESSION_PAYMENT, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void transfer_userNotFound_throwsException() {
        UUID fromId = UUID.randomUUID();
        UUID toId = UUID.randomUUID();

        when(userRepository.findByIdForUpdate(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                ledgerService.transferCredits(fromId, toId, new BigDecimal("10.00"),
                        LedgerEntryType.SESSION_PAYMENT, null))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}