package com.smallpeanut.dto;

import java.time.Instant;

public record StatusTagResponse(
        Long id,
        String tagName,
        String note,
        Instant recordedAt,
        Instant createdAt
) {}
