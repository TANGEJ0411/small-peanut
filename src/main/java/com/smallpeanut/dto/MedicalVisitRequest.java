package com.smallpeanut.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record MedicalVisitRequest(
        String clinicName,
        String doctor,
        @NotBlank String reason,
        String diagnosis,
        @NotNull Instant visitedAt,
        String notes
) {}
