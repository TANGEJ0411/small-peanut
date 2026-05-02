package com.smallpeanut.dto;

import java.time.Instant;

public record DashboardResponse(
        LastDiaper lastDiaper,
        LastPumping lastPumping,
        Integer todaySleepMinutes,
        ActiveSleep activeSleep
) {
    public record LastDiaper(String type, Instant recordedAt) {}
    public record LastPumping(Integer totalAmount, Instant pumpedAt) {}
    public record ActiveSleep(Long id, Instant fellAsleepAt, Integer elapsedMinutes) {}
}
