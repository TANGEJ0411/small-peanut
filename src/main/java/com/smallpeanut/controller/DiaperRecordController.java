package com.smallpeanut.controller;

import com.smallpeanut.dto.DiaperRecordRequest;
import com.smallpeanut.dto.DiaperRecordResponse;
import com.smallpeanut.service.DiaperRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/diapers")
@RequiredArgsConstructor
public class DiaperRecordController {

    private final DiaperRecordService service;

    @GetMapping
    public List<DiaperRecordResponse> getAll() {
        return service.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DiaperRecordResponse create(@Valid @RequestBody DiaperRecordRequest request) {
        return service.create(request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
