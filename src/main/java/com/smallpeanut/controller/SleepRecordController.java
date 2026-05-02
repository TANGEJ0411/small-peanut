package com.smallpeanut.controller;

import com.smallpeanut.dto.SleepRecordRequest;
import com.smallpeanut.dto.SleepRecordResponse;
import com.smallpeanut.service.SleepRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/sleep")
@RequiredArgsConstructor
public class SleepRecordController {

    private final SleepRecordService service;

    @GetMapping
    public List<SleepRecordResponse> getAll() {
        return service.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SleepRecordResponse create(@Valid @RequestBody SleepRecordRequest request) {
        return service.create(request);
    }

    @PatchMapping("/{id}/wake")
    public SleepRecordResponse wake(@PathVariable Long id, @Valid @RequestBody SleepRecordRequest request) {
        return service.wake(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
