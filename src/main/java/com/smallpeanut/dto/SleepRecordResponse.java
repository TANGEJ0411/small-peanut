package com.smallpeanut.dto;

import java.time.Instant;

public record SleepRecordResponse(
        Long id,
        Instant fellAsleepAt,
        Instant wokeUpAt,
        Integer durationMinutes,
        String location,
        String note,
        Instant createdAt
) {}
