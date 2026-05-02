package com.smallpeanut.dto;

import com.smallpeanut.model.DiaperType;
import java.time.Instant;

public record DiaperRecordResponse(
        Long id,
        DiaperType type,
        String color,
        String texture,
        String note,
        Instant recordedAt,
        Instant createdAt
) {}
