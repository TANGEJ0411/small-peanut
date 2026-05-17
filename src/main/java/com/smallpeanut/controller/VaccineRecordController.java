package com.smallpeanut.controller;

import com.smallpeanut.dto.VaccineRecordRequest;
import com.smallpeanut.dto.VaccineRecordResponse;
import com.smallpeanut.service.VaccineRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/vaccines")
@RequiredArgsConstructor
public class VaccineRecordController {

    private final VaccineRecordService service;

    @GetMapping
    public List<VaccineRecordResponse> getAll(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        if (from != null && to != null) {
            return service.findByDateRange(Instant.parse(from), Instant.parse(to));
        }
        return service.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VaccineRecordResponse create(@Valid @RequestBody VaccineRecordRequest request) {
        return service.create(request);
    }

    @PatchMapping("/{id}/complete")
    public VaccineRecordResponse complete(@PathVariable Long id) {
        return service.complete(id);
    }

    @PatchMapping("/{id}/revert")
    public VaccineRecordResponse revert(@PathVariable Long id) {
        return service.revert(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
