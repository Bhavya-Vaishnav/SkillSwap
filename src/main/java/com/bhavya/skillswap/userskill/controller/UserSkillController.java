package com.bhavya.skillswap.userskill.controller;

import com.bhavya.skillswap.userskill.dto.*;
import com.bhavya.skillswap.userskill.service.UserSkillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/user-skills")
@RequiredArgsConstructor
public class UserSkillController {

    private final UserSkillService userSkillService;

    @PostMapping
    public ResponseEntity<UserSkillResponse> addSkill(@AuthenticationPrincipal UUID userId,
                                                      @Valid @RequestBody UserSkillRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userSkillService.addUserSkill(userId, req));
    }

    @GetMapping("/me")
    public ResponseEntity<List<UserSkillResponse>> getMySkills(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(userSkillService.getUserSkills(userId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<UserSkillResponse>> getUserSkills(@PathVariable UUID userId) {
        return ResponseEntity.ok(userSkillService.getUserSkills(userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUserSkill(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
        userSkillService.deleteUserSkill(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/proficiency")
    public ResponseEntity<UserSkillResponse> updateProficiency(@AuthenticationPrincipal UUID userId, @PathVariable UUID id, @Valid @RequestBody UpdateProficiencyRequest req) {
        return ResponseEntity.ok(userSkillService.updateProficiency(userId, id, req.proficiency()));
    }

    @PostMapping("/parse-bio")
    public ResponseEntity<ParsedBioResult> parseBio(@Valid @RequestBody ParseBioRequest req) {
        return ResponseEntity.ok(userSkillService.parseBio(req.bioText()));
    }

    @PostMapping("/confirm-bio")
    public ResponseEntity<List<UserSkillResponse>> confirmBio(@AuthenticationPrincipal UUID userId, @Valid @RequestBody ConfirmBioRequest req) {
        return ResponseEntity.ok(userSkillService.confirmBioSkills(userId, req.confirmedSkills()));
    }
}