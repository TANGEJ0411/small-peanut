package com.smallpeanut.service;

import com.smallpeanut.model.MealSlot;
import com.smallpeanut.model.MedicalVisitRecord;
import com.smallpeanut.model.MedicationSchedule;
import com.smallpeanut.model.PumpingRecord;
import com.smallpeanut.model.VaccineRecord;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@Service
public class LineMessagingService {

    private static final String PUSH_URL = "https://api.line.me/v2/bot/message/push";
    private static final ZoneId TAIPEI = ZoneId.of("Asia/Taipei");

    @Value("${line.bot.channel-token:}")
    private String channelToken;

    private final RestTemplate restTemplate;

    public LineMessagingService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public void sendToGroup(String groupId, String text) {
        if (groupId == null || channelToken.isBlank()) return;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(channelToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "to", groupId,
                "messages", List.of(Map.of("type", "text", "text", text))
        );

        try {
            restTemplate.postForEntity(PUSH_URL, new HttpEntity<>(body, headers), String.class);
        } catch (Exception ignored) {
        }
    }

    public String buildMilkExpiryMessage(List<PumpingRecord> records) {
        ZonedDateTime now = ZonedDateTime.now(TAIPEI);
        LocalDate today = now.toLocalDate();
        StringBuilder sb = new StringBuilder("🍼 母奶庫存到期提醒\n─────────────────");
        for (PumpingRecord r : records) {
            String batchNo = "#" + String.format("%03d", r.getId());
            String storageLabel = switch (r.getStorageType()) {
                case ROOM_TEMP -> "常溫";
                case FRIDGE -> "冷藏";
                case FREEZER -> "冷凍";
            };
            ZonedDateTime expiresAtTaipei = r.getExpiresAt().atZone(ZoneOffset.UTC).withZoneSameInstant(TAIPEI);
            String expiryStr = formatExpiryTime(expiresAtTaipei, today);
            String remaining = formatRemaining(ChronoUnit.MINUTES.between(now, expiresAtTaipei));
            sb.append("\n")
              .append(batchNo).append(" ").append(storageLabel)
              .append(" ").append(r.getRemainingAmount()).append("ml → ")
              .append(expiryStr).append("（").append(remaining).append("）");
        }
        return sb.toString();
    }

    public String buildMealMedicationMessage(String mealTitle, List<MedicationSchedule> before, List<MedicationSchedule> after) {
        StringBuilder sb = new StringBuilder("💊 ").append(mealTitle).append("用藥提醒\n─────────────");
        for (MedicationSchedule s : before) {
            sb.append("\n").append(mealTitle).append("前：").append(formatMed(s));
        }
        for (MedicationSchedule s : after) {
            sb.append("\n").append(mealTitle).append("後：").append(formatMed(s));
        }
        return sb.toString();
    }

    public String buildSleepMedicationMessage(List<MedicationSchedule> schedules) {
        StringBuilder sb = new StringBuilder("💊 睡前用藥提醒\n─────────────");
        for (MedicationSchedule s : schedules) {
            sb.append("\n睡前：").append(formatMed(s));
        }
        return sb.toString();
    }

    public String buildMorningAppointmentSummary(List<VaccineRecord> vaccines,
                                                   List<MedicalVisitRecord> visits,
                                                   List<MedicationSchedule> mealSchedules) {
        if (vaccines.isEmpty() && visits.isEmpty() && mealSchedules.isEmpty()) return null;

        StringBuilder sb = new StringBuilder("📅 今日行程提醒\n─────────────────");
        for (VaccineRecord v : vaccines) {
            ZonedDateTime t = v.getAdministeredAt().atZone(ZoneOffset.UTC).withZoneSameInstant(TAIPEI);
            sb.append("\n💉 ").append(v.getName())
              .append(" ").append(String.format("%02d:%02d", t.getHour(), t.getMinute()));
            if (v.getClinicName() != null && !v.getClinicName().isBlank())
                sb.append("（").append(v.getClinicName()).append("）");
        }
        for (MedicalVisitRecord mv : visits) {
            ZonedDateTime t = mv.getVisitedAt().atZone(ZoneOffset.UTC).withZoneSameInstant(TAIPEI);
            sb.append("\n🏥 ").append(mv.getReason())
              .append(" ").append(String.format("%02d:%02d", t.getHour(), t.getMinute()));
            if (mv.getClinicName() != null && !mv.getClinicName().isBlank())
                sb.append("（").append(mv.getClinicName()).append("）");
        }
        if (!mealSchedules.isEmpty()) {
            sb.append("\n💊 今日用藥：");
            StringBuilder meds = new StringBuilder();
            for (MedicationSchedule s : mealSchedules) {
                if (!meds.isEmpty()) meds.append("、");
                meds.append(s.getName());
                if (s.getDosage() != null && !s.getDosage().isBlank()) meds.append(" ").append(s.getDosage());
            }
            sb.append(meds);
        }
        return sb.toString();
    }

    public String buildVaccineReminderMessage(VaccineRecord v) {
        ZonedDateTime t = v.getAdministeredAt().atZone(ZoneOffset.UTC).withZoneSameInstant(TAIPEI);
        StringBuilder sb = new StringBuilder("💉 疫苗預約提醒（約 1 小時後）\n─────────────────")
                .append("\n").append(v.getName())
                .append(" ").append(String.format("%02d:%02d", t.getHour(), t.getMinute()));
        if (v.getClinicName() != null && !v.getClinicName().isBlank())
            sb.append("\n診所：").append(v.getClinicName());
        return sb.toString();
    }

    public String buildVisitReminderMessage(MedicalVisitRecord mv) {
        ZonedDateTime t = mv.getVisitedAt().atZone(ZoneOffset.UTC).withZoneSameInstant(TAIPEI);
        StringBuilder sb = new StringBuilder("🏥 就醫預約提醒（約 1 小時後）\n─────────────────")
                .append("\n").append(mv.getReason())
                .append(" ").append(String.format("%02d:%02d", t.getHour(), t.getMinute()));
        if (mv.getClinicName() != null && !mv.getClinicName().isBlank())
            sb.append("\n診所：").append(mv.getClinicName());
        return sb.toString();
    }

    private String formatMed(MedicationSchedule s) {
        String result = s.getName();
        if (s.getDosage() != null && !s.getDosage().isBlank()) result += " " + s.getDosage();
        result += " " + switch (s.getRoute()) {
            case ORAL -> "口服";
            case TOPICAL -> "外用";
            case INJECTION -> "注射";
            case EYE_EAR_DROPS -> "眼耳滴劑";
            case INHALER -> "吸入";
            case SUPPOSITORY -> "栓劑";
        };
        return result;
    }

    private String formatExpiryTime(ZonedDateTime expiresAt, LocalDate today) {
        String timeStr = String.format("%02d:%02d", expiresAt.getHour(), expiresAt.getMinute());
        if (expiresAt.toLocalDate().equals(today)) return "今日 " + timeStr;
        return expiresAt.getMonthValue() + "/" + expiresAt.getDayOfMonth() + " " + timeStr;
    }

    private String formatRemaining(long minutes) {
        if (minutes < 0) return "已過期";
        if (minutes < 60) return "剩 " + minutes + " 分鐘";
        long hours = minutes / 60;
        if (hours <= 48) return "剩 " + hours + " 小時";
        return "剩 " + (hours / 24) + " 天";
    }
}
