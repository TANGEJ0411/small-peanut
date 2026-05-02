package com.smallpeanut.repository;

import com.smallpeanut.model.DiaperRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface DiaperRecordRepository extends JpaRepository<DiaperRecord, Long> {
    List<DiaperRecord> findAllByOrderByRecordedAtDesc();
    List<DiaperRecord> findAllByRecordedAtBetweenOrderByRecordedAtDesc(LocalDateTime from, LocalDateTime to);
}
