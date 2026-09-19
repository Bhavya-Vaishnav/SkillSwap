package com.bhavya.skillswap.userskill.dto;

import jakarta.validation.constraints.NotBlank;

public record ParseBioRequest(@NotBlank String bioText) {
}