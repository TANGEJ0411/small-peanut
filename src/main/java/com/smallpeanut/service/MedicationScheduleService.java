package com.smallpeanut.service;

import com.smallpeanut.dto.MedicationScheduleRequest;
import com.smallpeanut.dto.MedicationScheduleResponse;
import com.smallpeanut.model.MedicationSchedule;
import com.smallpeanut.repository.MedicationScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicationScheduleService {

    private final MedicationScheduleRepository repository;

    public List<MedicationScheduleResponse> findAll() {
        return repository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse).toList();
    }

    public MedicationScheduleResponse create(MedicationScheduleRequest request) {
        MedicationSchedule schedule = new MedicationSchedule();
        schedule.setName(request.name());
        schedule.setDosage(request.dosage());
        schedule.setRoute(request.route());
        schedule.setTimingType(request.timingType());
        if (request.mealSlots() != null) schedule.setMealSlots(request.mealSlots());
        schedule.setFrequencyPerDay(request.frequencyPerDay());
        schedule.setStartDate(LocalDate.parse(request.startDate()));
        schedule.setEndDate(request.endDate() != null && !request.endDate().isBlank()
                ? LocalDate.parse(request.endDate()) : null);
        schedule.setNotes(request.notes());
        schedule.setActive(true);
        return toResponse(repository.save(schedule));
    }

    public MedicationScheduleResponse toggleActive(Long id) {
        MedicationSchedule schedule = repository.findById(id).orElseThrow();
        schedule.setActive(!schedule.isActive());
        return toResponse(repository.save(schedule));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private MedicationScheduleResponse toResponse(MedicationSchedule s) {
        return new MedicationScheduleResponse(
                s.getId(), s.getName(), s.getDosage(),
                s.getRoute().name(), s.getTimingType().name(),
                s.getMealSlots().stream().map(Enum::name).toList(),
                s.getFrequencyPerDay(),
                s.getStartDate().toString(),
                s.getEndDate() != null ? s.getEndDate().toString() : null,
                s.isActive(), s.getNotes(),
                s.getCreatedAt().toInstant(ZoneOffset.UTC)
        );
    }
}
