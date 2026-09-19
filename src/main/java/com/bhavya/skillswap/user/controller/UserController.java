package com.bhavya.skillswap.user.controller;

import com.bhavya.skillswap.user.dto.UpdateBioRequest;
import com.bhavya.skillswap.user.dto.UserMatchResponse;
import com.bhavya.skillswap.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PutMapping("/me/bio")
    public ResponseEntity<Void> updateBio(@AuthenticationPrincipal UUID userId,
                                          @Valid @RequestBody UpdateBioRequest req) {
        userService.updateBio(userId, req.bio());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserMatchResponse>> search(@AuthenticationPrincipal UUID userId,
                                                          @RequestParam String query) {
        return ResponseEntity.ok(userService.searchUsers(userId, query, 5));
    }
}