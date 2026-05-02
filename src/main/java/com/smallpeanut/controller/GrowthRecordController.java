package com.smallpeanut.controller;

import com.smallpeanut.dto.GrowthRecordRequest;
import com.smallpeanut.dto.GrowthRecordResponse;
import com.smallpeanut.service.GrowthRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/growth")
@RequiredArgsConstructor
public class GrowthRecordController {

    private final GrowthRecordService service;

    @GetMapping
    public List<GrowthRecordResponse> getAll(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        if (from != null && to != null) {
            return service.findByDateRange(Instant.parse(from), Instant.parse(to));
        }
        return service.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GrowthRecordResponse create(@Valid @RequestBody GrowthRecordRequest request) {
        return service.create(request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
