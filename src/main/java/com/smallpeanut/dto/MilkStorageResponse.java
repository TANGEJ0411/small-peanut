package com.smallpeanut.dto;

import com.smallpeanut.model.StorageType;
import java.time.Instant;

public record MilkStorageResponse(
        Long id,
        Integer amount,
        StorageType storageType,
        Instant storedAt,
        Instant expiresAt,
        String note,
        Instant createdAt
) {}
