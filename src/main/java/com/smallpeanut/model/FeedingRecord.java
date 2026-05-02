package com.smallpeanut.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Data
@Entity
@Table(name = "feeding_records")
public class FeedingRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FeedingType feedingType;

    private String side;

    private Integer amountMl;

    @Column(nullable = false)
    private LocalDateTime startedAt;

    private LocalDateTime endedAt;

    private Integer durationMinutes;

    private String note;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now(ZoneOffset.UTC);
    }
}
