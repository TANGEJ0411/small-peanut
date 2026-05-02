package com.smallpeanut.service;

import com.smallpeanut.dto.DashboardResponse;
import com.smallpeanut.model.SleepRecord;
import com.smallpeanut.repository.DiaperRecordRepository;
import com.smallpeanut.repository.FeedingRecordRepository;
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

    private static final int NEXT_FEEDING_INTERVAL_HOURS = 3;

    private final DiaperRecordRepository diaperRepository;
    private final FeedingRecordRepository feedingRepository;
    private final SleepRecordRepository sleepRepository;

    public DashboardResponse getSummary() {
        return new DashboardResponse(
                buildLastDiaper(),
                buildLastFeeding(),
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

    private DashboardResponse.LastFeeding buildLastFeeding() {
        return feedingRepository.findAllByOrderByStartedAtDesc().stream()
                .findFirst()
                .map(r -> {
                    var startedAt = r.getStartedAt().toInstant(ZoneOffset.UTC);
                    var nextFeedingAt = r.getStartedAt()
                            .plusHours(NEXT_FEEDING_INTERVAL_HOURS)
                            .toInstant(ZoneOffset.UTC);
                    return new DashboardResponse.LastFeeding(
                            r.getFeedingType().name(),
                            startedAt,
                            nextFeedingAt);
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
