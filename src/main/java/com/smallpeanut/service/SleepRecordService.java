package com.smallpeanut.service;

import com.smallpeanut.dto.SleepRecordRequest;
import com.smallpeanut.dto.SleepRecordResponse;
import com.smallpeanut.model.SleepRecord;
import com.smallpeanut.repository.SleepRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SleepRecordService {

    private final SleepRecordRepository repository;

    public List<SleepRecordResponse> findAll() {
        return repository.findAllByOrderByFellAsleepAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    public SleepRecordResponse create(SleepRecordRequest request) {
        SleepRecord record = new SleepRecord();
        record.setFellAsleepAt(LocalDateTime.ofInstant(request.fellAsleepAt(), ZoneOffset.UTC));
        if (request.wokeUpAt() != null) {
            LocalDateTime wokeUpAt = LocalDateTime.ofInstant(request.wokeUpAt(), ZoneOffset.UTC);
            record.setWokeUpAt(wokeUpAt);
            record.setDurationMinutes((int) ChronoUnit.MINUTES.between(record.getFellAsleepAt(), wokeUpAt));
        }
        record.setLocation(request.location());
        record.setNote(request.note());
        return toResponse(repository.save(record));
    }

    public SleepRecordResponse wake(Long id, SleepRecordRequest request) {
        SleepRecord record = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        LocalDateTime wokeUpAt = LocalDateTime.ofInstant(request.wokeUpAt(), ZoneOffset.UTC);
        record.setWokeUpAt(wokeUpAt);
        record.setDurationMinutes((int) ChronoUnit.MINUTES.between(record.getFellAsleepAt(), wokeUpAt));
        return toResponse(repository.save(record));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private SleepRecordResponse toResponse(SleepRecord r) {
        return new SleepRecordResponse(
                r.getId(),
                r.getFellAsleepAt().toInstant(ZoneOffset.UTC),
                r.getWokeUpAt() != null ? r.getWokeUpAt().toInstant(ZoneOffset.UTC) : null,
                r.getDurationMinutes(),
                r.getLocation(),
                r.getNote(),
                r.getCreatedAt().toInstant(ZoneOffset.UTC)
        );
    }
}
