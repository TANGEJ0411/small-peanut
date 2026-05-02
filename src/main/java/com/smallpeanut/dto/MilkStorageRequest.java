package com.smallpeanut.dto;

import com.smallpeanut.model.StorageType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.Instant;

public record MilkStorageRequest(
        @NotNull @Positive Integer amount,
        @NotNull StorageType storageType,
        @NotNull Instant storedAt,
        String note
) {}
