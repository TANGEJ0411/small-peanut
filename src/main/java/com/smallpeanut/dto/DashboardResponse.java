package com.smallpeanut.dto;

import java.time.Instant;

public record DashboardResponse(
        LastDiaper lastDiaper,
        LastFeeding lastFeeding,
        Integer todaySleepMinutes,
        ActiveSleep activeSleep
) {
    public record LastDiaper(String type, Instant recordedAt) {}
    public record LastFeeding(String feedingType, Instant startedAt, Instant nextFeedingAt) {}
    public record ActiveSleep(Long id, Instant fellAsleepAt, Integer elapsedMinutes) {}
}
