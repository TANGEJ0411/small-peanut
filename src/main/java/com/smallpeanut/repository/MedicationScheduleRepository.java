package com.smallpeanut.repository;

import com.smallpeanut.model.MedicationSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface MedicationScheduleRepository extends JpaRepository<MedicationSchedule, Long> {

    List<MedicationSchedule> findAllByOrderByCreatedAtDesc();

    @Query("SELECT s FROM MedicationSchedule s WHERE s.active = true AND s.startDate <= :today AND (s.endDate IS NULL OR s.endDate >= :today)")
    List<MedicationSchedule> findAllActiveForDate(@Param("today") LocalDate today);
}
