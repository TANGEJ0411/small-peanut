package com.smallpeanut.controller;

import com.smallpeanut.dto.MedicationScheduleRequest;
import com.smallpeanut.dto.MedicationScheduleResponse;
import com.smallpeanut.service.MedicationScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/medication-schedules")
@RequiredArgsConstructor
public class MedicationScheduleController {

    private final MedicationScheduleService service;

    @GetMapping
    public List<MedicationScheduleResponse> getAll() {
        return service.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MedicationScheduleResponse create(@Valid @RequestBody MedicationScheduleRequest request) {
        return service.create(request);
    }

    @PatchMapping("/{id}/toggle")
    public MedicationScheduleResponse toggle(@PathVariable Long id) {
        return service.toggleActive(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
