package com.smallpeanut.service;

import com.smallpeanut.dto.FeedingEndRequest;
import com.smallpeanut.dto.FeedingRecordRequest;
import com.smallpeanut.dto.FeedingRecordResponse;
import com.smallpeanut.model.FeedingRecord;
import com.smallpeanut.repository.FeedingRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FeedingRecordService {

    private final FeedingRecordRepository repository;

    public List<FeedingRecordResponse> findAll() {
        return repository.findAllByOrderByStartedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<FeedingRecordResponse> findByDateRange(Instant from, Instant to) {
        return repository.findAllByStartedAtBetweenOrderByStartedAtDesc(
                LocalDateTime.ofInstant(from, ZoneOffset.UTC),
                LocalDateTime.ofInstant(to, ZoneOffset.UTC))
                .stream().map(this::toResponse).toList();
    }

    public FeedingRecordResponse create(FeedingRecordRequest request) {
        FeedingRecord record = new FeedingRecord();
        record.setFeedingType(request.feedingType());
        record.setSide(request.side());
        record.setAmountMl(request.amountMl());
        record.setNote(request.note());
        LocalDateTime startedAt = LocalDateTime.ofInstant(request.startedAt(), ZoneOffset.UTC);
        record.setStartedAt(startedAt);
        if (request.endedAt() != null) {
            LocalDateTime endedAt = LocalDateTime.ofInstant(request.endedAt(), ZoneOffset.UTC);
            record.setEndedAt(endedAt);
            record.setDurationMinutes((int) ChronoUnit.MINUTES.between(startedAt, endedAt));
        }
        return toResponse(repository.save(record));
    }

    public FeedingRecordResponse end(Long id, FeedingEndRequest request) {
        FeedingRecord record = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        LocalDateTime endedAt = LocalDateTime.ofInstant(request.endedAt(), ZoneOffset.UTC);
        record.setEndedAt(endedAt);
        record.setDurationMinutes((int) ChronoUnit.MINUTES.between(record.getStartedAt(), endedAt));
        return toResponse(repository.save(record));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private FeedingRecordResponse toResponse(FeedingRecord r) {
        return new FeedingRecordResponse(
                r.getId(),
                r.getFeedingType(),
                r.getSide(),
                r.getAmountMl(),
                r.getStartedAt().toInstant(ZoneOffset.UTC),
                r.getEndedAt() != null ? r.getEndedAt().toInstant(ZoneOffset.UTC) : null,
                r.getDurationMinutes(),
                r.getNote(),
                r.getCreatedAt().toInstant(ZoneOffset.UTC)
        );
    }
}
