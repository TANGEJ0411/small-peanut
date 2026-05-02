package com.smallpeanut.service;

import com.smallpeanut.dto.StatusTagRequest;
import com.smallpeanut.dto.StatusTagResponse;
import com.smallpeanut.model.StatusTag;
import com.smallpeanut.repository.StatusTagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StatusTagService {

    private final StatusTagRepository repository;

    public List<StatusTagResponse> findAll() {
        return repository.findAllByOrderByRecordedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    public StatusTagResponse create(StatusTagRequest request) {
        StatusTag tag = new StatusTag();
        tag.setTagName(request.tagName());
        tag.setNote(request.note());
        tag.setRecordedAt(LocalDateTime.ofInstant(request.recordedAt(), ZoneOffset.UTC));
        return toResponse(repository.save(tag));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private StatusTagResponse toResponse(StatusTag t) {
        return new StatusTagResponse(
                t.getId(),
                t.getTagName(),
                t.getNote(),
                t.getRecordedAt().toInstant(ZoneOffset.UTC),
                t.getCreatedAt().toInstant(ZoneOffset.UTC)
        );
    }
}
