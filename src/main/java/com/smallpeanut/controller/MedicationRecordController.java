package com.smallpeanut.controller;

import com.smallpeanut.dto.MedicationRecordRequest;
import com.smallpeanut.dto.MedicationRecordResponse;
import com.smallpeanut.service.MedicationRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/medication-records")
@RequiredArgsConstructor
public class MedicationRecordController {

    private final MedicationRecordService service;

    @GetMapping
    public List<MedicationRecordResponse> getAll(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        if (from != null && to != null) {
            return service.findByDateRange(Instant.parse(from), Instant.parse(to));
        }
        return service.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MedicationRecordResponse create(@Valid @RequestBody MedicationRecordRequest request) {
        return service.create(request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
