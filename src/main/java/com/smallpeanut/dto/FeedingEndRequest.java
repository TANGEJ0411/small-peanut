package com.smallpeanut.dto;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record FeedingEndRequest(@NotNull Instant endedAt) {}
