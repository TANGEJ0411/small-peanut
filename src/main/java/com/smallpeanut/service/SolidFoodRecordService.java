package com.smallpeanut.service;

import com.smallpeanut.dto.SolidFoodRequest;
import com.smallpeanut.dto.SolidFoodResponse;
import com.smallpeanut.model.SolidFoodRecord;
import com.smallpeanut.repository.SolidFoodRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SolidFoodRecordService {
    private final SolidFoodRecordRepository repository;

    public List<SolidFoodResponse> findAll() {
        return repository.findAllByOrderByRecordedAtDesc().stream().map(this::toResponse).toList();
    }

    public List<SolidFoodResponse> findByDateRange(Instant from, Instant to) {
        return repository.findAllByRecordedAtBetweenOrderByRecordedAtDesc(
                LocalDateTime.ofInstant(from, ZoneOffset.UTC),
                LocalDateTime.ofInstant(to, ZoneOffset.UTC))
                .stream().map(this::toResponse).toList();
    }

    public SolidFoodResponse create(SolidFoodRequest request) {
        SolidFoodRecord record = new SolidFoodRecord();
        record.setRecordedAt(LocalDateTime.ofInstant(request.recordedAt(), ZoneOffset.UTC));
        record.setFoodName(request.foodName());
        record.setAmountG(request.amountG());
        record.setNewFood(request.newFood());
        record.setReaction(request.reaction());
        record.setNotes(request.notes());
        return toResponse(repository.save(record));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private SolidFoodResponse toResponse(SolidFoodRecord r) {
        return new SolidFoodResponse(
                r.getId(),
                r.getRecordedAt().toInstant(ZoneOffset.UTC),
                r.getFoodName(),
                r.getAmountG(),
                r.isNewFood(),
                r.getReaction() != null ? r.getReaction().name() : null,
                r.getNotes(),
                r.getCreatedAt().toInstant(ZoneOffset.UTC)
        );
    }
}
