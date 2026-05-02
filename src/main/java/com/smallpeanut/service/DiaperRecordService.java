package com.smallpeanut.service;

import com.smallpeanut.dto.DiaperRecordRequest;
import com.smallpeanut.dto.DiaperRecordResponse;
import com.smallpeanut.model.DiaperRecord;
import com.smallpeanut.repository.DiaperRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DiaperRecordService {

    private final DiaperRecordRepository repository;

    public List<DiaperRecordResponse> findAll() {
        return repository.findAllByOrderByRecordedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<DiaperRecordResponse> findByDateRange(Instant from, Instant to) {
        return repository.findAllByRecordedAtBetweenOrderByRecordedAtDesc(
                LocalDateTime.ofInstant(from, ZoneOffset.UTC),
                LocalDateTime.ofInstant(to, ZoneOffset.UTC))
                .stream().map(this::toResponse).toList();
    }

    public DiaperRecordResponse create(DiaperRecordRequest request) {
        DiaperRecord record = new DiaperRecord();
        record.setType(request.type());
        record.setColor(request.color());
        record.setTexture(request.texture());
        record.setNote(request.note());
        record.setRecordedAt(LocalDateTime.ofInstant(request.recordedAt(), ZoneOffset.UTC));
        return toResponse(repository.save(record));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private DiaperRecordResponse toResponse(DiaperRecord r) {
        return new DiaperRecordResponse(
                r.getId(),
                r.getType(),
                r.getColor(),
                r.getTexture(),
                r.getNote(),
                r.getRecordedAt().toInstant(ZoneOffset.UTC),
                r.getCreatedAt().toInstant(ZoneOffset.UTC)
        );
    }
}
