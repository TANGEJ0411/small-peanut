package com.smallpeanut.repository;

import com.smallpeanut.model.GrowthRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface GrowthRecordRepository extends JpaRepository<GrowthRecord, Long> {
    List<GrowthRecord> findAllByOrderByRecordedAtDesc();
    List<GrowthRecord> findAllByRecordedAtBetweenOrderByRecordedAtDesc(LocalDateTime from, LocalDateTime to);
}
