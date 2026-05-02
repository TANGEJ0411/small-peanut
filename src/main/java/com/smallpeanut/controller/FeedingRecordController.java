package com.smallpeanut.controller;

import com.smallpeanut.dto.FeedingEndRequest;
import com.smallpeanut.dto.FeedingRecordRequest;
import com.smallpeanut.dto.FeedingRecordResponse;
import com.smallpeanut.service.FeedingRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/feeding")
@RequiredArgsConstructor
public class FeedingRecordController {

    private final FeedingRecordService service;

    @GetMapping
    public List<FeedingRecordResponse> getAll() {
        return service.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FeedingRecordResponse create(@Valid @RequestBody FeedingRecordRequest request) {
        return service.create(request);
    }

    @PatchMapping("/{id}/end")
    public FeedingRecordResponse end(@PathVariable Long id, @Valid @RequestBody FeedingEndRequest request) {
        return service.end(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
