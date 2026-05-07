package com.smallpeanut.dto;

import com.smallpeanut.model.FoodReaction;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record SolidFoodRequest(
    @NotNull Instant recordedAt,
    @NotBlank String foodName,
    Integer amountG,
    boolean newFood,
    FoodReaction reaction,
    String notes
) {}
