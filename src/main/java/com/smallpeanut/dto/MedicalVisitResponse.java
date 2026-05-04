package com.smallpeanut.dto;

import java.time.Instant;

public record MedicalVisitResponse(
        Long id,
        String clinicName,
        String doctor,
        String reason,
        String diagnosis,
        Instant visitedAt,
        String notes,
        Instant createdAt
) {}
