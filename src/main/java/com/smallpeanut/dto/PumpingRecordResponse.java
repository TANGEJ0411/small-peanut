package com.smallpeanut.dto;

import com.smallpeanut.model.StorageType;
import java.time.Instant;

public record PumpingRecordResponse(
        Long id,
        Integer leftDuration,
        Integer rightDuration,
        Integer leftAmount,
        Integer rightAmount,
        Integer totalAmount,
        StorageType storageType,
        Instant expiresAt,
        Integer remainingAmount,
        String note,
        Instant pumpedAt,
        Instant createdAt
) {}
