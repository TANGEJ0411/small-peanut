package com.smallpeanut.dto;

import java.time.Instant;

public record SolidFoodResponse(
    Long id,
    Instant recordedAt,
    String foodName,
    Integer amountG,
    boolean newFood,
    String reaction,
    String notes,
    Instant createdAt
) {}
