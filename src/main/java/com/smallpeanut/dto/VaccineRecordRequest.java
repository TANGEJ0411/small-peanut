package com.smallpeanut.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record VaccineRecordRequest(
        @NotBlank String name,
        String clinicName,
        String batchNumber,
        @NotNull Instant administeredAt,
        String notes
) {}
