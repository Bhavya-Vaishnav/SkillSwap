package com.bhavya.skillswap.userskill.dto;

import jakarta.validation.constraints.NotNull;

public record ConfirmBioRequest(
        @NotNull ParsedBioResult confirmedSkills
) {
}