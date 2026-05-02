package com.smallpeanut.service;

import com.smallpeanut.dto.GrowthRecordRequest;
import com.smallpeanut.dto.GrowthRecordResponse;
import com.smallpeanut.model.GrowthRecord;
import com.smallpeanut.repository.GrowthRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GrowthRecordService {

    private final GrowthRecordRepository repository;

    public List<GrowthRecordResponse> findAll() {
        return repository.findAllByOrderByRecordedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<GrowthRecordResponse> findByDateRange(Instant from, Instant to) {
        return repository.findAllByRecordedAtBetweenOrderByRecordedAtDesc(
                LocalDateTime.ofInstant(from, ZoneOffset.UTC),
                LocalDateTime.ofInstant(to, ZoneOffset.UTC))
                .stream().map(this::toResponse).toList();
    }

    public GrowthRecordResponse create(GrowthRecordRequest request) {
        GrowthRecord record = new GrowthRecord();
        record.setHeightCm(request.heightCm());
        record.setWeightKg(request.weightKg());
        record.setHeadCircumferenceCm(request.headCircumferenceCm());
        record.setNote(request.note());
        record.setRecordedAt(LocalDateTime.ofInstant(request.recordedAt(), ZoneOffset.UTC));
        return toResponse(repository.save(record));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private GrowthRecordResponse toResponse(GrowthRecord r) {
        return new GrowthRecordResponse(
                r.getId(),
                r.getHeightCm(),
                r.getWeightKg(),
                r.getHeadCircumferenceCm(),
                r.getNote(),
                r.getRecordedAt().toInstant(ZoneOffset.UTC),
                r.getCreatedAt().toInstant(ZoneOffset.UTC)
        );
    }
}
