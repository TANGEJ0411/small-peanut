package com.smallpeanut.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.Instant;

public record GrowthRecordRequest(
        @Positive Double heightCm,
        @Positive Double weightKg,
        @Positive Double headCircumferenceCm,
        String note,
        @NotNull Instant recordedAt
) {}
