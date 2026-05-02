package com.smallpeanut.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record PumpingRemainingRequest(
        @NotNull @Min(0) Integer remaining
) {}
