package com.smallpeanut.dto;

import java.time.Instant;

public record VaccineRecordResponse(
        Long id,
        String name,
        String clinicName,
        String batchNumber,
        Instant administeredAt,
        String notes,
        Instant createdAt
) {}
