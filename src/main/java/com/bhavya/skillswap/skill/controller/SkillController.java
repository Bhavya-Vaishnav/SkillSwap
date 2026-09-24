package com.bhavya.skillswap.skill.controller;

import com.bhavya.skillswap.skill.dto.SkillMatchResponse;
import com.bhavya.skillswap.skill.dto.SkillRequest;
import com.bhavya.skillswap.skill.dto.SkillResponse;
import com.bhavya.skillswap.skill.service.SkillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/skills")
@RequiredArgsConstructor
public class SkillController {

    private final SkillService skillService;

    @PostMapping
    public ResponseEntity<SkillResponse> create(@Valid @RequestBody SkillRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(skillService.createSkill(req));
    }

    @GetMapping
    public ResponseEntity<List<SkillResponse>> listAll() {
        return ResponseEntity.ok(skillService.listAll());
    }

    @GetMapping("/search")
    public ResponseEntity<List<SkillMatchResponse>> search(@RequestParam String query) {
        return ResponseEntity.ok(skillService.searchSkills(query, 5));
    }
}