package com.smallpeanut.service;

import com.smallpeanut.dto.VaccineRecordRequest;
import com.smallpeanut.dto.VaccineRecordResponse;
import com.smallpeanut.model.VaccineRecord;
import com.smallpeanut.repository.VaccineRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VaccineRecordService {

    private final VaccineRecordRepository repository;

    public List<VaccineRecordResponse> findAll() {
        return repository.findAllByOrderByAdministeredAtDesc().stream()
                .map(this::toResponse).toList();
    }

    public List<VaccineRecordResponse> findByDateRange(Instant from, Instant to) {
        return repository.findAllByAdministeredAtBetweenOrderByAdministeredAtDesc(
                LocalDateTime.ofInstant(from, ZoneOffset.UTC),
                LocalDateTime.ofInstant(to, ZoneOffset.UTC))
                .stream().map(this::toResponse).toList();
    }

    public VaccineRecordResponse create(VaccineRecordRequest request) {
        VaccineRecord record = new VaccineRecord();
        record.setName(request.name());
        record.setClinicName(request.clinicName());
        record.setBatchNumber(request.batchNumber());
        record.setAdministeredAt(LocalDateTime.ofInstant(request.administeredAt(), ZoneOffset.UTC));
        record.setNotes(request.notes());
        return toResponse(repository.save(record));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private VaccineRecordResponse toResponse(VaccineRecord r) {
        return new VaccineRecordResponse(
                r.getId(), r.getName(), r.getClinicName(), r.getBatchNumber(),
                r.getAdministeredAt().toInstant(ZoneOffset.UTC),
                r.getNotes(), r.getCreatedAt().toInstant(ZoneOffset.UTC)
        );
    }
}
