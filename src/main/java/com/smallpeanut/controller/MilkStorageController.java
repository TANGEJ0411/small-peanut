package com.smallpeanut.controller;

import com.smallpeanut.dto.MilkStorageRequest;
import com.smallpeanut.dto.MilkStorageResponse;
import com.smallpeanut.service.MilkStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/milk-storage")
@RequiredArgsConstructor
public class MilkStorageController {

    private final MilkStorageService service;

    @GetMapping
    public List<MilkStorageResponse> getAll() {
        return service.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MilkStorageResponse create(@Valid @RequestBody MilkStorageRequest request) {
        return service.create(request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
