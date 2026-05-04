package com.smallpeanut.repository;

import com.smallpeanut.model.VaccineRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface VaccineRecordRepository extends JpaRepository<VaccineRecord, Long> {

    List<VaccineRecord> findAllByOrderByAdministeredAtDesc();

    List<VaccineRecord> findAllByAdministeredAtBetweenOrderByAdministeredAtDesc(
            LocalDateTime from, LocalDateTime to);
}
