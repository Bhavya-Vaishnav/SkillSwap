package com.bhavya.skillswap.auth.service;

import com.bhavya.skillswap.auth.dto.AuthResponse;
import com.bhavya.skillswap.auth.dto.LoginRequest;
import com.bhavya.skillswap.auth.dto.RegisterRequest;
import com.bhavya.skillswap.common.BaseIntegrationTest;
import com.bhavya.skillswap.common.exception.EmailAlreadyRegisteredException;
import com.bhavya.skillswap.common.exception.InvalidCredentialsException;
import com.bhavya.skillswap.ledger.entity.LedgerEntry;
import com.bhavya.skillswap.ledger.entity.LedgerEntryType;
import com.bhavya.skillswap.ledger.repository.LedgerEntryRepository;
import com.bhavya.skillswap.ledger.service.LedgerService;
import com.bhavya.skillswap.user.entity.User;
import com.bhavya.skillswap.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AuthIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LedgerService ledgerService;

    @Autowired
    private LedgerEntryRepository ledgerEntryRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @AfterEach
    void tearDown() {
        ledgerEntryRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Register transactionally creates user with hashed password and 100-credit signup bonus in real DB")
    void register_createsUserAndSignupBonusInLedger() {
        String email = "auth-reg-" + UUID.randomUUID() + "@test.com";
        String rawPassword = "SecurePassword123!";
        RegisterRequest request = new RegisterRequest(email, rawPassword, "Registered User");

        AuthResponse response = authService.register(request);

        assertThat(response.token()).isNotBlank();
        assertThat(response.userId()).isNotNull();
        assertThat(response.displayName()).isEqualTo("Registered User");

        // Verify user in real database
        User savedUser = userRepository.findById(response.userId()).orElseThrow();
        assertThat(savedUser.getEmail()).isEqualTo(email);
        assertThat(savedUser.getPasswordHash()).isNotEqualTo(rawPassword);
        assertThat(passwordEncoder.matches(rawPassword, savedUser.getPasswordHash())).isTrue();

        // Verify signup bonus in ledger
        BigDecimal balance = ledgerService.getBalance(savedUser.getId());
        assertThat(balance).isEqualByComparingTo("100.00");

        List<LedgerEntry> entries = ledgerEntryRepository.findByUserIdOrderByCreatedAtDesc(savedUser.getId());
        assertThat(entries).hasSize(1);
        assertThat(entries.getFirst().getEntryType()).isEqualTo(LedgerEntryType.SIGNUP_BONUS);
        assertThat(entries.getFirst().getAmount()).isEqualByComparingTo("100.00");
    }

    @Test
    @DisplayName("Database unique constraint users_email_key rejects duplicate email registrations")
    void uniqueEmailConstraint_enforcedAtDatabaseLevel() {
        String sharedEmail = "duplicate-" + UUID.randomUUID() + "@test.com";
        authService.register(new RegisterRequest(sharedEmail, "Password123!", "First User"));

        // Application-level check
        assertThatThrownBy(() -> authService.register(new RegisterRequest(sharedEmail, "Password123!", "Second User")))
                .isInstanceOf(EmailAlreadyRegisteredException.class);

        // Database-level check bypassing service
        User directDuplicate = new User(sharedEmail, passwordEncoder.encode("Password123!"), "Direct Duplicate");
        assertThatThrownBy(() -> userRepository.saveAndFlush(directDuplicate))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("users_email_key");
    }

    @Test
    @DisplayName("Login verifies password hash against real database and issues JWT")
    void login_authenticatesAgainstHashedPassword() {
        String email = "auth-login-" + UUID.randomUUID() + "@test.com";
        String rawPassword = "CorrectPassword123!";
        authService.register(new RegisterRequest(email, rawPassword, "Login User"));

        // Valid login
        AuthResponse loginResponse = authService.login(new LoginRequest(email, rawPassword));
        assertThat(loginResponse.token()).isNotBlank();
        assertThat(loginResponse.displayName()).isEqualTo("Login User");

        // Invalid password
        assertThatThrownBy(() -> authService.login(new LoginRequest(email, "WrongPassword!")))
                .isInstanceOf(InvalidCredentialsException.class);

        // Non-existent user
        assertThatThrownBy(() -> authService.login(new LoginRequest("nobody-" + UUID.randomUUID() + "@test.com", rawPassword)))
                .isInstanceOf(InvalidCredentialsException.class);
    }
}
