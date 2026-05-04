package com.smallpeanut.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Data
@Entity
@Table(name = "medication_records")
public class MedicationRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long scheduleId;

    @Column(nullable = false)
    private String name;

    private String dosage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MedicationRoute route;

    @Enumerated(EnumType.STRING)
    private MealSlot mealSlot;

    @Column(nullable = false)
    private LocalDateTime administeredAt;

    private String notes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now(ZoneOffset.UTC);
    }
}
