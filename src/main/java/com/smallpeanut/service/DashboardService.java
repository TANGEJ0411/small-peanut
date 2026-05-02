package com.smallpeanut.service;

import com.smallpeanut.dto.DashboardResponse;
import com.smallpeanut.model.DiaperRecord;
import com.smallpeanut.model.PumpingRecord;
import com.smallpeanut.model.SleepRecord;
import com.smallpeanut.repository.DiaperRecordRepository;
import com.smallpeanut.repository.PumpingRecordRepository;
import com.smallpeanut.repository.SleepRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final DiaperRecordRepository diaperRepository;
    private final PumpingRecordRepository pumpingRepository;
    private final SleepRecordRepository sleepRepository;

    public DashboardResponse getSummary() {
        return new DashboardResponse(
                buildLastDiaper(),
                buildLastPumping(),
                buildTodaySleepMinutes(),
                buildActiveSleep()
        );
    }

    private DashboardResponse.LastDiaper buildLastDiaper() {
        return diaperRepository.findAllByOrderByRecordedAtDesc().stream()
                .findFirst()
                .map(r -> new DashboardResponse.LastDiaper(
                        r.getType().name(),
                        r.getRecordedAt().toInstant(ZoneOffset.UTC)))
                .orElse(null);
    }

    private DashboardResponse.LastPumping buildLastPumping() {
        return pumpingRepository.findAllByOrderByPumpedAtDesc().stream()
                .findFirst()
                .map(r -> {
                    int total = (r.getLeftAmount() != null ? r.getLeftAmount() : 0)
                              + (r.getRightAmount() != null ? r.getRightAmount() : 0);
                    return new DashboardResponse.LastPumping(
                            total,
                            r.getPumpedAt().toInstant(ZoneOffset.UTC));
                })
                .orElse(null);
    }

    private Integer buildTodaySleepMinutes() {
        LocalDateTime since = LocalDateTime.now(ZoneOffset.UTC).minusHours(24);
        List<SleepRecord> recent = sleepRepository.findAllSince(since);
        return recent.stream()
                .filter(r -> r.getDurationMinutes() != null)
                .mapToInt(SleepRecord::getDurationMinutes)
                .sum();
    }

    private DashboardResponse.ActiveSleep buildActiveSleep() {
        return sleepRepository.findAllByOrderByFellAsleepAtDesc().stream()
                .filter(r -> r.getWokeUpAt() == null)
                .findFirst()
                .map(r -> {
                    int elapsed = (int) ChronoUnit.MINUTES.between(
                            r.getFellAsleepAt(), LocalDateTime.now(ZoneOffset.UTC));
                    return new DashboardResponse.ActiveSleep(
                            r.getId(),
                            r.getFellAsleepAt().toInstant(ZoneOffset.UTC),
                            elapsed);
                })
                .orElse(null);
    }
}
