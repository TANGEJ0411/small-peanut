package com.smallpeanut.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Data
@Entity
@Table(name = "solid_food_records")
public class SolidFoodRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime recordedAt;

    @Column(nullable = false)
    private String foodName;

    private Integer amountG;

    @Column(nullable = false)
    private boolean newFood;

    @Enumerated(EnumType.STRING)
    private FoodReaction reaction;

    private String notes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now(ZoneOffset.UTC);
    }
}
