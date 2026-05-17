package com.smallpeanut.service;

import com.smallpeanut.dto.AppSettingsRequest;
import com.smallpeanut.dto.AppSettingsResponse;
import com.smallpeanut.model.AppSettings;
import com.smallpeanut.repository.AppSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AppSettingsService {

    private final AppSettingsRepository repository;

    public AppSettings getOrCreate() {
        return repository.findById(1L).orElseGet(() -> repository.save(new AppSettings()));
    }

    public AppSettingsResponse getResponse() {
        return toResponse(getOrCreate());
    }

    public AppSettingsResponse update(AppSettingsRequest request) {
        AppSettings s = getOrCreate();
        if (request.milkExpiryNotificationEnabled() != null)
            s.setMilkExpiryNotificationEnabled(request.milkExpiryNotificationEnabled());
        if (request.medicationNotificationEnabled() != null)
            s.setMedicationNotificationEnabled(request.medicationNotificationEnabled());
        return toResponse(repository.save(s));
    }

    public void updateLineGroupId(String groupId) {
        AppSettings s = getOrCreate();
        s.setLineGroupId(groupId);
        repository.save(s);
    }

    public AppSettingsResponse clearLineGroupId() {
        AppSettings s = getOrCreate();
        s.setLineGroupId(null);
        return toResponse(repository.save(s));
    }

    private AppSettingsResponse toResponse(AppSettings s) {
        return new AppSettingsResponse(
                s.getLineGroupId() != null,
                s.isMilkExpiryNotificationEnabled(),
                s.isMedicationNotificationEnabled()
        );
    }
}
