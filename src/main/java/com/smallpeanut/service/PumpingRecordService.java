package com.smallpeanut.service;

import com.smallpeanut.dto.PumpingRecordRequest;
import com.smallpeanut.dto.PumpingRecordResponse;
import com.smallpeanut.model.PumpingRecord;
import com.smallpeanut.repository.PumpingRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
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

    public PumpingRecordResponse create(PumpingRecordRequest request) {
        PumpingRecord record = new PumpingRecord();
        record.setLeftDuration(request.leftDuration());
        record.setRightDuration(request.rightDuration());
        record.setLeftAmount(request.leftAmount());
        record.setRightAmount(request.rightAmount());
        record.setNote(request.note());
        record.setPumpedAt(LocalDateTime.ofInstant(request.pumpedAt(), ZoneOffset.UTC));
        return toResponse(repository.save(record));
    }

    public void delete(Long id) {
        repository.deleteById(id);
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
                r.getNote(),
                r.getPumpedAt().toInstant(ZoneOffset.UTC),
                r.getCreatedAt().toInstant(ZoneOffset.UTC)
        );
    }
}
