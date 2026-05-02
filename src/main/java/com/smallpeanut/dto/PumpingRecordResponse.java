package com.smallpeanut.dto;

import java.time.Instant;

public record PumpingRecordResponse(
        Long id,
        Integer leftDuration,
        Integer rightDuration,
        Integer leftAmount,
        Integer rightAmount,
        Integer totalAmount,
        String note,
        Instant pumpedAt,
        Instant createdAt
) {}
