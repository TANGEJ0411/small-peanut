package com.smallpeanut.controller;

import com.smallpeanut.dto.AppSettingsRequest;
import com.smallpeanut.dto.AppSettingsResponse;
import com.smallpeanut.service.AppSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
public class AppSettingsController {

    private final AppSettingsService service;

    @GetMapping
    public AppSettingsResponse get() {
        return service.getResponse();
    }

    @PutMapping
    public AppSettingsResponse update(@RequestBody AppSettingsRequest request) {
        return service.update(request);
    }

    @DeleteMapping("/line-group")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clearLineGroup() {
        service.clearLineGroupId();
    }
}
