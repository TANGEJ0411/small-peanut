package com.smallpeanut.service;

import com.smallpeanut.model.AppSettings;
import com.smallpeanut.model.HealthEventStatus;
import com.smallpeanut.model.MealSlot;
import com.smallpeanut.model.MedicalVisitRecord;
import com.smallpeanut.model.MedicationSchedule;
import com.smallpeanut.model.PumpingRecord;
import com.smallpeanut.model.TimingType;
import com.smallpeanut.model.VaccineRecord;
import com.smallpeanut.repository.MedicalVisitRepository;
import com.smallpeanut.repository.MedicationScheduleRepository;
import com.smallpeanut.repository.PumpingRecordRepository;
import com.smallpeanut.repository.VaccineRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class NotificationScheduler {

    private static final ZoneId TAIPEI = ZoneId.of("Asia/Taipei");

    private final AppSettingsService settingsService;
    private final MedicationScheduleRepository scheduleRepository;
    private final PumpingRecordRepository pumpingRepository;
    private final VaccineRecordRepository vaccineRepository;
    private final MedicalVisitRepository visitRepository;
    private final LineMessagingService lineService;

    private final Set<Long> sentVaccineReminderIds = Collections.synchronizedSet(new HashSet<>());
    private final Set<Long> sentVisitReminderIds = Collections.synchronizedSet(new HashSet<>());

    @Scheduled(cron = "0 0 8 * * *", zone = "Asia/Taipei")
    public void sendBreakfastReminder() {
        sendMealReminder("早餐", List.of(MealSlot.BEFORE_BREAKFAST), List.of(MealSlot.AFTER_BREAKFAST));
    }

    @Scheduled(cron = "0 0 12 * * *", zone = "Asia/Taipei")
    public void sendLunchReminder() {
        sendMealReminder("午餐", List.of(MealSlot.BEFORE_LUNCH), List.of(MealSlot.AFTER_LUNCH));
    }

    @Scheduled(cron = "0 0 18 * * *", zone = "Asia/Taipei")
    public void sendDinnerReminder() {
        sendMealReminder("晚餐", List.of(MealSlot.BEFORE_DINNER), List.of(MealSlot.AFTER_DINNER));
    }

    @Scheduled(cron = "0 0 21 * * *", zone = "Asia/Taipei")
    public void sendSleepReminder() {
        AppSettings settings = settingsService.getOrCreate();
        if (settings.getLineGroupId() == null || !settings.isMedicationNotificationEnabled()) return;

        LocalDate today = LocalDate.now(TAIPEI);
        List<MedicationSchedule> sleepMeds = scheduleRepository.findAllActiveForDate(today)
                .stream()
                .filter(s -> s.getMealSlots().contains(MealSlot.BEFORE_SLEEP))
                .toList();

        if (sleepMeds.isEmpty()) return;
        lineService.sendToGroup(settings.getLineGroupId(), lineService.buildSleepMedicationMessage(sleepMeds));
    }

    @Scheduled(cron = "0 0 8 * * *", zone = "Asia/Taipei")
    public void sendMilkExpiryReminder() {
        AppSettings settings = settingsService.getOrCreate();
        if (settings.getLineGroupId() == null || !settings.isMilkExpiryNotificationEnabled()) return;

        List<PumpingRecord> records = pumpingRepository.findAllByStorageTypeIsNotNullOrderByPumpedAtDesc()
                .stream()
                .filter(r -> r.getRemainingAmount() != null && r.getRemainingAmount() > 0)
                .toList();

        if (records.isEmpty()) return;
        lineService.sendToGroup(settings.getLineGroupId(), lineService.buildMilkExpiryMessage(records));
    }

    @Scheduled(cron = "0 0 8 * * *", zone = "Asia/Taipei")
    public void sendMorningAppointmentSummary() {
        AppSettings settings = settingsService.getOrCreate();
        if (settings.getLineGroupId() == null || !settings.isMedicationNotificationEnabled()) return;

        LocalDate today = LocalDate.now(TAIPEI);
        ZonedDateTime startOfDay = today.atStartOfDay(TAIPEI);
        LocalDateTime startUtc = startOfDay.withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
        LocalDateTime endUtc = startOfDay.plusDays(1).withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();

        List<VaccineRecord> vaccines = vaccineRepository.findByStatusAndAdministeredAtBetween(
                HealthEventStatus.PLANNED, startUtc, endUtc);
        List<MedicalVisitRecord> visits = visitRepository.findByStatusAndVisitedAtBetween(
                HealthEventStatus.PLANNED, startUtc, endUtc);
        List<MedicationSchedule> mealSchedules = scheduleRepository.findAllActiveForDate(today)
                .stream().filter(s -> s.getTimingType() == TimingType.MEAL_BASED).toList();

        String message = lineService.buildMorningAppointmentSummary(vaccines, visits, mealSchedules);
        if (message != null) lineService.sendToGroup(settings.getLineGroupId(), message);
    }

    @Scheduled(cron = "0 0 * * * *", zone = "Asia/Taipei")
    public void sendOneHourReminders() {
        AppSettings settings = settingsService.getOrCreate();
        if (settings.getLineGroupId() == null || !settings.isMedicationNotificationEnabled()) return;

        LocalDate today = LocalDate.now(TAIPEI);
        ZonedDateTime startOfDay = today.atStartOfDay(TAIPEI);
        LocalDateTime startUtc = startOfDay.withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
        LocalDateTime endUtc = startOfDay.plusDays(1).withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
        LocalDateTime nowUtc = LocalDateTime.now(ZoneOffset.UTC);
        LocalDateTime in60Utc = nowUtc.plusMinutes(60);

        vaccineRepository.findByStatusAndAdministeredAtBetween(HealthEventStatus.PLANNED, startUtc, endUtc)
                .stream()
                .filter(v -> v.getAdministeredAt().isAfter(nowUtc) && !v.getAdministeredAt().isAfter(in60Utc))
                .filter(v -> !sentVaccineReminderIds.contains(v.getId()))
                .forEach(v -> {
                    lineService.sendToGroup(settings.getLineGroupId(), lineService.buildVaccineReminderMessage(v));
                    sentVaccineReminderIds.add(v.getId());
                });

        visitRepository.findByStatusAndVisitedAtBetween(HealthEventStatus.PLANNED, startUtc, endUtc)
                .stream()
                .filter(mv -> mv.getVisitedAt().isAfter(nowUtc) && !mv.getVisitedAt().isAfter(in60Utc))
                .filter(mv -> !sentVisitReminderIds.contains(mv.getId()))
                .forEach(mv -> {
                    lineService.sendToGroup(settings.getLineGroupId(), lineService.buildVisitReminderMessage(mv));
                    sentVisitReminderIds.add(mv.getId());
                });
    }

    @Scheduled(cron = "0 0 0 * * *", zone = "Asia/Taipei")
    public void resetDailySentReminders() {
        sentVaccineReminderIds.clear();
        sentVisitReminderIds.clear();
    }

    private void sendMealReminder(String mealTitle, List<MealSlot> beforeSlots, List<MealSlot> afterSlots) {
        AppSettings settings = settingsService.getOrCreate();
        if (settings.getLineGroupId() == null || !settings.isMedicationNotificationEnabled()) return;

        LocalDate today = LocalDate.now(TAIPEI);
        List<MedicationSchedule> active = scheduleRepository.findAllActiveForDate(today);

        List<MedicationSchedule> before = active.stream()
                .filter(s -> s.getMealSlots().stream().anyMatch(beforeSlots::contains))
                .toList();
        List<MedicationSchedule> after = active.stream()
                .filter(s -> s.getMealSlots().stream().anyMatch(afterSlots::contains))
                .toList();

        if (before.isEmpty() && after.isEmpty()) return;
        lineService.sendToGroup(settings.getLineGroupId(),
                lineService.buildMealMedicationMessage(mealTitle, before, after));
    }
}
