package com.bhavya.skillswap.ledger.controller;

import com.bhavya.skillswap.common.util.JwtUtil;
import com.bhavya.skillswap.ledger.dto.BalanceResponse;
import com.bhavya.skillswap.ledger.dto.TransferRequest;
import com.bhavya.skillswap.ledger.service.LedgerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/ledger")
@RequiredArgsConstructor
public class LedgerController {

    private final LedgerService ledgerService;

    @GetMapping("/balance")
    public ResponseEntity<BalanceResponse> getBalance(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(new BalanceResponse(userId, ledgerService.getBalance(userId)));
    }

    @PostMapping("/transfer")
    public ResponseEntity<Void> transfer(@AuthenticationPrincipal UUID userId,
                                         @Valid @RequestBody TransferRequest req) {
        ledgerService.transferCredits(userId, req.toUserId(), req.amount(), req.entryType(), req.referenceId());
        return ResponseEntity.ok().build();
    }
}