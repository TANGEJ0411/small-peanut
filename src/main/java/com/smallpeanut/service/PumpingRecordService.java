package com.smallpeanut.service;

import com.smallpeanut.dto.PumpingRecordRequest;
import com.smallpeanut.dto.PumpingRecordResponse;
import com.smallpeanut.model.PumpingRecord;
import com.smallpeanut.model.StorageType;
import com.smallpeanut.repository.PumpingRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PumpingRecordService {

    private final PumpingRecordRepository repository;

    public List<PumpingRecordResponse> findAll() {
        return repository.findAllByOrderByPumpedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<PumpingRecordResponse> findByDateRange(Instant from, Instant to) {
        return repository.findAllByPumpedAtBetweenOrderByPumpedAtDesc(
                LocalDateTime.ofInstant(from, ZoneOffset.UTC),
                LocalDateTime.ofInstant(to, ZoneOffset.UTC))
                .stream().map(this::toResponse).toList();
    }

    public List<PumpingRecordResponse> findAllStorage() {
        return repository.findAllByStorageTypeIsNotNullOrderByPumpedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    public PumpingRecordResponse create(PumpingRecordRequest request) {
        PumpingRecord record = new PumpingRecord();
        record.setLeftDuration(request.leftDuration());
        record.setRightDuration(request.rightDuration());
        record.setLeftAmount(request.leftAmount());
        record.setRightAmount(request.rightAmount());
        record.setNote(request.note());
        record.setPumpedAt(LocalDateTime.ofInstant(request.pumpedAt(), ZoneOffset.UTC));
        if (request.storageType() != null) {
            record.setStorageType(request.storageType());
            record.setExpiresAt(calculateExpiry(record.getPumpedAt(), request.storageType()));
            int total = (request.leftAmount() != null ? request.leftAmount() : 0)
                      + (request.rightAmount() != null ? request.rightAmount() : 0);
            if (total > 0) record.setRemainingAmount(total);
        }
        return toResponse(repository.save(record));
    }

    public PumpingRecordResponse updateRemaining(Long id, Integer remaining) {
        PumpingRecord record = repository.findById(id).orElseThrow();
        record.setRemainingAmount(remaining);
        return toResponse(repository.save(record));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private LocalDateTime calculateExpiry(LocalDateTime pumpedAt, StorageType type) {
        return switch (type) {
            case ROOM_TEMP -> pumpedAt.plusHours(3);
            case FRIDGE    -> pumpedAt.plusDays(3);
            case FREEZER   -> pumpedAt.plusMonths(3);
        };
    }

    private PumpingRecordResponse toResponse(PumpingRecord r) {
        int total = (r.getLeftAmount() != null ? r.getLeftAmount() : 0)
                  + (r.getRightAmount() != null ? r.getRightAmount() : 0);
        return new PumpingRecordResponse(
                r.getId(),
                r.getLeftDuration(),
                r.getRightDuration(),
                r.getLeftAmount(),
                r.getRightAmount(),
                total,
                r.getStorageType(),
                r.getExpiresAt() != null ? r.getExpiresAt().toInstant(ZoneOffset.UTC) : null,
                r.getRemainingAmount(),
                r.getNote(),
                r.getPumpedAt().toInstant(ZoneOffset.UTC),
                r.getCreatedAt().toInstant(ZoneOffset.UTC)
        );
    }
}
