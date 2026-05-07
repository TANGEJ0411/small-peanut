package com.smallpeanut.repository;

import com.smallpeanut.model.SolidFoodRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface SolidFoodRecordRepository extends JpaRepository<SolidFoodRecord, Long> {
    List<SolidFoodRecord> findAllByOrderByRecordedAtDesc();
    List<SolidFoodRecord> findAllByRecordedAtBetweenOrderByRecordedAtDesc(LocalDateTime from, LocalDateTime to);
}
