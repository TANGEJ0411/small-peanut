package com.smallpeanut.dto;

import java.time.Instant;

public record GrowthRecordResponse(
        Long id,
        Double heightCm,
        Double weightKg,
        Double headCircumferenceCm,
        String note,
        Instant recordedAt,
        Instant createdAt
) {}
