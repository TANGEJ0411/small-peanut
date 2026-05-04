package com.smallpeanut.dto;

import java.time.Instant;

public record MedicationRecordResponse(
        Long id,
        Long scheduleId,
        String name,
        String dosage,
        String route,
        String mealSlot,
        Instant administeredAt,
        String notes,
        Instant createdAt
) {}
