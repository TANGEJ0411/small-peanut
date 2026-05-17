package com.smallpeanut.repository;

import com.smallpeanut.model.HealthEventStatus;
import com.smallpeanut.model.MedicalVisitRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface MedicalVisitRepository extends JpaRepository<MedicalVisitRecord, Long> {

    List<MedicalVisitRecord> findAllByOrderByVisitedAtDesc();

    List<MedicalVisitRecord> findAllByVisitedAtBetweenOrderByVisitedAtDesc(
            LocalDateTime from, LocalDateTime to);

    List<MedicalVisitRecord> findByStatusAndVisitedAtBetween(
            HealthEventStatus status, LocalDateTime from, LocalDateTime to);
}
