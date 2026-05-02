package com.smallpeanut.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record StatusTagRequest(
        @NotBlank String tagName,
        String note,
        @NotNull Instant recordedAt
) {}
