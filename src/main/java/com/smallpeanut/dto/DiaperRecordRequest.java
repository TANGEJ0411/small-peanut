package com.smallpeanut.dto;

import com.smallpeanut.model.DiaperType;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record DiaperRecordRequest(
        @NotNull DiaperType type,
        String color,
        String texture,
        String note,
        @NotNull Instant recordedAt
) {}
