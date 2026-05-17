package com.smallpeanut.dto;

public record AppSettingsRequest(
        Boolean milkExpiryNotificationEnabled,
        Boolean medicationNotificationEnabled
) {
}
