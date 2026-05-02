package com.smallpeanut.dto;

import com.smallpeanut.model.FeedingType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.Instant;

public record FeedingRecordRequest(
        @NotNull FeedingType feedingType,
        String side,
        @Positive Integer amountMl,
        @NotNull Instant startedAt,
        Instant endedAt,
        String note
) {}
