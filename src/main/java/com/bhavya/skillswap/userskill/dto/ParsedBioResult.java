package com.bhavya.skillswap.userskill.dto;

import java.util.List;

public record ParsedBioResult(List<ParsedSkill> offered, List<String> wanted) {
}