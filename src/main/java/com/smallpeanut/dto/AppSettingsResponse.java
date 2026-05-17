package com.smallpeanut.dto;

public record AppSettingsResponse(
        boolean lineGroupBound,
        boolean milkExpiryNotificationEnabled,
        boolean medicationNotificationEnabled
) {
}
