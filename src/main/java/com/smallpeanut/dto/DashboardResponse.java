package com.smallpeanut.dto;

import java.time.Instant;
import java.util.List;

public record DashboardResponse(
        LastDiaper lastDiaper,
        LastFeeding lastFeeding,
        Integer todaySleepMinutes,
        ActiveSleep activeSleep,
        List<PendingMedication> upcomingMedications
) {
    public record LastDiaper(String type, Instant recordedAt) {}
    public record LastFeeding(String feedingType, Instant startedAt, Instant nextFeedingAt) {}
    public record ActiveSleep(Long id, Instant fellAsleepAt, Integer elapsedMinutes) {}
    public record PendingMedication(
            Long scheduleId,
            String name,
            String dosage,
            String route,
            String timingType,
            String mealSlot,
            Integer doneToday,
            Integer totalToday
    ) {}
}
