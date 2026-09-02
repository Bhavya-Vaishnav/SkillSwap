package com.bhavya.skillswap.auth.service;

import com.bhavya.skillswap.auth.dto.AuthResponse;
import com.bhavya.skillswap.auth.dto.LoginRequest;
import com.bhavya.skillswap.auth.dto.RegisterRequest;
import com.bhavya.skillswap.common.exception.EmailAlreadyRegisteredException;
import com.bhavya.skillswap.common.exception.InvalidCredentialsException;
import com.bhavya.skillswap.common.util.JwtUtil;
import com.bhavya.skillswap.ledger.service.LedgerService;
import com.bhavya.skillswap.user.entity.User;
import com.bhavya.skillswap.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final LedgerService ledgerService;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new EmailAlreadyRegisteredException("Email already registered");
        }

        User user = new User(req.email(), passwordEncoder.encode(req.password()), req.displayName());
        User savedUser = userRepository.save(user);
        ledgerService.grantSignupBonus(savedUser.getId(), new BigDecimal("100.00"));
        String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getEmail());

        return new AuthResponse(token, savedUser.getId(), savedUser.getDisplayName());
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail());

        return new AuthResponse(token, user.getId(), user.getDisplayName());
    }
}
