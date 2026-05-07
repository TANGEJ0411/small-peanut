package com.smallpeanut.controller;

import com.smallpeanut.dto.SolidFoodRequest;
import com.smallpeanut.dto.SolidFoodResponse;
import com.smallpeanut.service.SolidFoodRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/solid-food")
@RequiredArgsConstructor
public class SolidFoodRecordController {
    private final SolidFoodRecordService service;

    @GetMapping
    public List<SolidFoodResponse> getAll(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        if (from != null && to != null)
            return service.findByDateRange(Instant.parse(from), Instant.parse(to));
        return service.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SolidFoodResponse create(@Valid @RequestBody SolidFoodRequest request) {
        return service.create(request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
