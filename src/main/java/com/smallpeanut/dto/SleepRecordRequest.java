package com.smallpeanut.dto;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record SleepRecordRequest(
        @NotNull Instant fellAsleepAt,
        Instant wokeUpAt,
        String location,
        String note
) {}
