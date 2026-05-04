package com.smallpeanut.service;

import com.smallpeanut.dto.MedicationRecordRequest;
import com.smallpeanut.dto.MedicationRecordResponse;
import com.smallpeanut.model.MedicationRecord;
import com.smallpeanut.model.MedicationSchedule;
import com.smallpeanut.repository.MedicationRecordRepository;
import com.smallpeanut.repository.MedicationScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicationRecordService {

    private final MedicationRecordRepository repository;
    private final MedicationScheduleRepository scheduleRepository;

    public List<MedicationRecordResponse> findAll() {
        return repository.findAllByOrderByAdministeredAtDesc().stream()
                .map(this::toResponse).toList();
    }

    public List<MedicationRecordResponse> findByDateRange(Instant from, Instant to) {
        return repository.findAllByAdministeredAtBetweenOrderByAdministeredAtDesc(
                LocalDateTime.ofInstant(from, ZoneOffset.UTC),
                LocalDateTime.ofInstant(to, ZoneOffset.UTC))
                .stream().map(this::toResponse).toList();
    }

    public MedicationRecordResponse create(MedicationRecordRequest request) {
        MedicationRecord record = new MedicationRecord();

        if (request.scheduleId() != null) {
            MedicationSchedule schedule = scheduleRepository.findById(request.scheduleId()).orElseThrow();
            record.setScheduleId(schedule.getId());
            record.setName(request.name() != null ? request.name() : schedule.getName());
            record.setDosage(request.dosage() != null ? request.dosage() : schedule.getDosage());
            record.setRoute(request.route() != null ? request.route() : schedule.getRoute());
        } else {
            if (request.name() == null || request.name().isBlank()) {
                throw new IllegalArgumentException("name is required when scheduleId is not provided");
            }
            if (request.route() == null) {
                throw new IllegalArgumentException("route is required when scheduleId is not provided");
            }
            record.setName(request.name());
            record.setDosage(request.dosage());
            record.setRoute(request.route());
        }

        record.setMealSlot(request.mealSlot());
        record.setAdministeredAt(LocalDateTime.ofInstant(request.administeredAt(), ZoneOffset.UTC));
        record.setNotes(request.notes());
        return toResponse(repository.save(record));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private MedicationRecordResponse toResponse(MedicationRecord r) {
        return new MedicationRecordResponse(
                r.getId(), r.getScheduleId(), r.getName(), r.getDosage(),
                r.getRoute().name(),
                r.getMealSlot() != null ? r.getMealSlot().name() : null,
                r.getAdministeredAt().toInstant(ZoneOffset.UTC),
                r.getNotes(),
                r.getCreatedAt().toInstant(ZoneOffset.UTC)
        );
    }
}
