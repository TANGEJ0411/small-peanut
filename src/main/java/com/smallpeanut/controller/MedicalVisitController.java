package com.smallpeanut.controller;

import com.smallpeanut.dto.MedicalVisitRequest;
import com.smallpeanut.dto.MedicalVisitResponse;
import com.smallpeanut.service.MedicalVisitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/medical-visits")
@RequiredArgsConstructor
public class MedicalVisitController {

    private final MedicalVisitService service;

    @GetMapping
    public List<MedicalVisitResponse> getAll(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        if (from != null && to != null) {
            return service.findByDateRange(Instant.parse(from), Instant.parse(to));
        }
        return service.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MedicalVisitResponse create(@Valid @RequestBody MedicalVisitRequest request) {
        return service.create(request);
    }

    @PatchMapping("/{id}/complete")
    public MedicalVisitResponse complete(@PathVariable Long id) {
        return service.complete(id);
    }

    @PatchMapping("/{id}/revert")
    public MedicalVisitResponse revert(@PathVariable Long id) {
        return service.revert(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
