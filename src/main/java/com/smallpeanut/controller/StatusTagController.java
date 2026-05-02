package com.smallpeanut.controller;

import com.smallpeanut.dto.StatusTagRequest;
import com.smallpeanut.dto.StatusTagResponse;
import com.smallpeanut.service.StatusTagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/tags")
@RequiredArgsConstructor
public class StatusTagController {

    private final StatusTagService service;

    @GetMapping
    public List<StatusTagResponse> getAll(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        if (from != null && to != null) {
            return service.findByDateRange(Instant.parse(from), Instant.parse(to));
        }
        return service.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StatusTagResponse create(@Valid @RequestBody StatusTagRequest request) {
        return service.create(request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
