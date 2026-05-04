package com.smallpeanut.repository;

import com.smallpeanut.model.MedicationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface MedicationRecordRepository extends JpaRepository<MedicationRecord, Long> {

    List<MedicationRecord> findAllByOrderByAdministeredAtDesc();

    List<MedicationRecord> findAllByAdministeredAtBetweenOrderByAdministeredAtDesc(
            LocalDateTime from, LocalDateTime to);

    List<MedicationRecord> findAllByAdministeredAtBetween(
            LocalDateTime from, LocalDateTime to);
}
