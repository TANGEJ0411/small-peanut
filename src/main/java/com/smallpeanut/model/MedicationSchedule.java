package com.smallpeanut.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "medication_schedules")
public class MedicationSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String dosage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MedicationRoute route;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TimingType timingType;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "medication_schedule_meal_slots", joinColumns = @JoinColumn(name = "schedule_id"))
    @Column(name = "meal_slot")
    @Enumerated(EnumType.STRING)
    private List<MealSlot> mealSlots = new ArrayList<>();

    private Integer frequencyPerDay;

    @Column(nullable = false)
    private LocalDate startDate;

    private LocalDate endDate;

    @Column(nullable = false)
    private boolean active = true;

    private String notes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now(ZoneOffset.UTC);
    }
}
