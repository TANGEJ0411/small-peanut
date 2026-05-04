package com.smallpeanut.dto;

import com.smallpeanut.model.MealSlot;
import com.smallpeanut.model.MedicationRoute;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record MedicationRecordRequest(
        Long scheduleId,
        String name,
        String dosage,
        MedicationRoute route,
        MealSlot mealSlot,
        @NotNull Instant administeredAt,
        String notes
) {}
