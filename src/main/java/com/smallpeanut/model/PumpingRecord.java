package com.smallpeanut.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Data
@Entity
@Table(name = "pumping_records")
public class PumpingRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer leftDuration;
    private Integer rightDuration;
    private Integer leftAmount;
    private Integer rightAmount;
    private String note;

    @Column(nullable = false)
    private LocalDateTime pumpedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now(ZoneOffset.UTC);
    }
}
