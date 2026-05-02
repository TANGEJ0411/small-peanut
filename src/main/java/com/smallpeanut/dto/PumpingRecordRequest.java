package com.smallpeanut.dto;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record PumpingRecordRequest(
        Integer leftDuration,
        Integer rightDuration,
        Integer leftAmount,
        Integer rightAmount,
        String note,
        @NotNull Instant pumpedAt
) {}
