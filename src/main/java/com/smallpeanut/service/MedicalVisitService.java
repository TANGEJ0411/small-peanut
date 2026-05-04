package com.smallpeanut.service;

import com.smallpeanut.dto.MedicalVisitRequest;
import com.smallpeanut.dto.MedicalVisitResponse;
import com.smallpeanut.model.MedicalVisitRecord;
import com.smallpeanut.repository.MedicalVisitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicalVisitService {

    private final MedicalVisitRepository repository;

    public List<MedicalVisitResponse> findAll() {
        return repository.findAllByOrderByVisitedAtDesc().stream()
                .map(this::toResponse).toList();
    }

    public List<MedicalVisitResponse> findByDateRange(Instant from, Instant to) {
        return repository.findAllByVisitedAtBetweenOrderByVisitedAtDesc(
                LocalDateTime.ofInstant(from, ZoneOffset.UTC),
                LocalDateTime.ofInstant(to, ZoneOffset.UTC))
                .stream().map(this::toResponse).toList();
    }

    public MedicalVisitResponse create(MedicalVisitRequest request) {
        MedicalVisitRecord record = new MedicalVisitRecord();
        record.setClinicName(request.clinicName());
        record.setDoctor(request.doctor());
        record.setReason(request.reason());
        record.setDiagnosis(request.diagnosis());
        record.setVisitedAt(LocalDateTime.ofInstant(request.visitedAt(), ZoneOffset.UTC));
        record.setNotes(request.notes());
        return toResponse(repository.save(record));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private MedicalVisitResponse toResponse(MedicalVisitRecord r) {
        return new MedicalVisitResponse(
                r.getId(), r.getClinicName(), r.getDoctor(), r.getReason(), r.getDiagnosis(),
                r.getVisitedAt().toInstant(ZoneOffset.UTC),
                r.getNotes(), r.getCreatedAt().toInstant(ZoneOffset.UTC)
        );
    }
}
