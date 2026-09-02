package com.bhavya.skillswap.session.controller;

import com.bhavya.skillswap.session.dto.SessionRequest;
import com.bhavya.skillswap.session.dto.SessionResponse;
import com.bhavya.skillswap.session.service.SessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    @PostMapping
    public ResponseEntity<SessionResponse> request(@AuthenticationPrincipal UUID userId,
                                                   @Valid @RequestBody SessionRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sessionService.requestSession(userId, req));
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<SessionResponse> accept(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
        return ResponseEntity.ok(sessionService.acceptSession(userId, id));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<SessionResponse> reject(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
        return ResponseEntity.ok(sessionService.rejectSession(userId, id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<SessionResponse> cancel(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
        return ResponseEntity.ok(sessionService.cancelSession(userId, id));
    }

    @PostMapping("/{id}/dispute")
    public ResponseEntity<SessionResponse> dispute(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
        return ResponseEntity.ok(sessionService.disputeSession(userId, id));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<SessionResponse> complete(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
        return ResponseEntity.ok(sessionService.completeSession(userId, id));
    }

    @GetMapping("/me")
    public ResponseEntity<List<SessionResponse>> mySessions(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(sessionService.getMySessions(userId));
    }
}