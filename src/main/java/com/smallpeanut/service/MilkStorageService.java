package com.smallpeanut.service;

import com.smallpeanut.dto.MilkStorageRequest;
import com.smallpeanut.dto.MilkStorageResponse;
import com.smallpeanut.model.MilkStorage;
import com.smallpeanut.model.StorageType;
import com.smallpeanut.repository.MilkStorageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MilkStorageService {

    private final MilkStorageRepository repository;

    public List<MilkStorageResponse> findAll() {
        return repository.findAllByOrderByStoredAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    public MilkStorageResponse create(MilkStorageRequest request) {
        MilkStorage storage = new MilkStorage();
        storage.setAmount(request.amount());
        storage.setStorageType(request.storageType());
        LocalDateTime storedAt = LocalDateTime.ofInstant(request.storedAt(), ZoneOffset.UTC);
        storage.setStoredAt(storedAt);
        storage.setExpiresAt(calculateExpiry(storedAt, request.storageType()));
        storage.setNote(request.note());
        return toResponse(repository.save(storage));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private LocalDateTime calculateExpiry(LocalDateTime storedAt, StorageType type) {
        return switch (type) {
            case ROOM_TEMP -> storedAt.plusHours(3);
            case FRIDGE    -> storedAt.plusDays(3);
            case FREEZER   -> storedAt.plusMonths(3);
        };
    }

    private MilkStorageResponse toResponse(MilkStorage s) {
        return new MilkStorageResponse(
                s.getId(),
                s.getAmount(),
                s.getStorageType(),
                s.getStoredAt().toInstant(ZoneOffset.UTC),
                s.getExpiresAt().toInstant(ZoneOffset.UTC),
                s.getNote(),
                s.getCreatedAt().toInstant(ZoneOffset.UTC)
        );
    }
}
