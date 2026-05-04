package com.smallpeanut.dto;

import java.time.Instant;
import java.util.List;

public record MedicationScheduleResponse(
        Long id,
        String name,
        String dosage,
        String route,
        String timingType,
        List<String> mealSlots,
        Integer frequencyPerDay,
        String startDate,
        String endDate,
        boolean active,
        String notes,
        Instant createdAt
) {}
