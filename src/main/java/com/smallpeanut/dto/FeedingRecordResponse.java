package com.smallpeanut.dto;

import com.smallpeanut.model.FeedingType;
import java.time.Instant;

public record FeedingRecordResponse(
        Long id,
        FeedingType feedingType,
        String side,
        Integer amountMl,
        Instant startedAt,
        Instant endedAt,
        Integer durationMinutes,
        String note,
        Instant createdAt
) {}
