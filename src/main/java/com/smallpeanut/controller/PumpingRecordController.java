package com.smallpeanut.controller;

import com.smallpeanut.dto.PumpingRecordRequest;
import com.smallpeanut.dto.PumpingRecordResponse;
import com.smallpeanut.service.PumpingRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/pumping")
@RequiredArgsConstructor
public class PumpingRecordController {

    private final PumpingRecordService service;

    @GetMapping
    public List<PumpingRecordResponse> getAll(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        if (from != null && to != null) {
            return service.findByDateRange(Instant.parse(from), Instant.parse(to));
        }
        return service.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PumpingRecordResponse create(@Valid @RequestBody PumpingRecordRequest request) {
        return service.create(request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
