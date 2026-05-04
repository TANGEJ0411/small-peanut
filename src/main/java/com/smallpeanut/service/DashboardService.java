package com.smallpeanut.service;

import com.smallpeanut.dto.DashboardResponse;
import com.smallpeanut.model.*;
import com.smallpeanut.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final int NEXT_FEEDING_INTERVAL_HOURS = 3;

    private final DiaperRecordRepository diaperRepository;
    private final FeedingRecordRepository feedingRepository;
    private final SleepRecordRepository sleepRepository;
    private final MedicationScheduleRepository medicationScheduleRepository;
    private final MedicationRecordRepository medicationRecordRepository;

    public DashboardResponse getSummary() {
        return new DashboardResponse(
                buildLastDiaper(),
                buildLastFeeding(),
                buildTodaySleepMinutes(),
                buildActiveSleep(),
                buildUpcomingMedications()
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

    private List<DashboardResponse.PendingMedication> buildUpcomingMedications() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(23, 59, 59, 999_000_000);

        List<MedicationSchedule> activeSchedules =
                medicationScheduleRepository.findAllActiveForDate(today);
        List<MedicationRecord> todayRecords =
                medicationRecordRepository.findAllByAdministeredAtBetween(startOfDay, endOfDay);

        List<DashboardResponse.PendingMedication> result = new ArrayList<>();

        for (MedicationSchedule schedule : activeSchedules) {
            if (schedule.getTimingType() == TimingType.MEAL_BASED) {
                for (MealSlot slot : schedule.getMealSlots()) {
                    boolean done = todayRecords.stream().anyMatch(r ->
                            schedule.getId().equals(r.getScheduleId()) && slot == r.getMealSlot());
                    if (!done) {
                        result.add(new DashboardResponse.PendingMedication(
                                schedule.getId(), schedule.getName(), schedule.getDosage(),
                                schedule.getRoute().name(), TimingType.MEAL_BASED.name(),
                                slot.name(), null, null));
                    }
                }
            } else if (schedule.getTimingType() == TimingType.DAILY_FREQUENCY
                    && schedule.getFrequencyPerDay() != null) {
                long doneCount = todayRecords.stream()
                        .filter(r -> schedule.getId().equals(r.getScheduleId())).count();
                if (doneCount < schedule.getFrequencyPerDay()) {
                    result.add(new DashboardResponse.PendingMedication(
                            schedule.getId(), schedule.getName(), schedule.getDosage(),
                            schedule.getRoute().name(), TimingType.DAILY_FREQUENCY.name(),
                            null, (int) doneCount, schedule.getFrequencyPerDay()));
                }
            }
        }

        return result;
    }
}
