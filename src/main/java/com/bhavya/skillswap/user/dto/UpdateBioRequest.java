package com.bhavya.skillswap.user.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateBioRequest(@NotBlank String bio) {
}