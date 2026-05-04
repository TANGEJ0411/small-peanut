package com.smallpeanut.dto;

import com.smallpeanut.model.MealSlot;
import com.smallpeanut.model.MedicationRoute;
import com.smallpeanut.model.TimingType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record MedicationScheduleRequest(
        @NotBlank String name,
        String dosage,
        @NotNull MedicationRoute route,
        @NotNull TimingType timingType,
        List<MealSlot> mealSlots,
        Integer frequencyPerDay,
        @NotNull String startDate,
        String endDate,
        String notes
) {}
