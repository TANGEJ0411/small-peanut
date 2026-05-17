package com.smallpeanut.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Data
@Entity
@Table(name = "app_settings")
public class AppSettings {

    @Id
    private Long id = 1L;

    private String lineGroupId;

    @Column(nullable = false)
    private boolean milkExpiryNotificationEnabled = true;

    @Column(nullable = false)
    private boolean medicationNotificationEnabled = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now(ZoneOffset.UTC);
    }
}
