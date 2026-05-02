package com.smallpeanut.repository;

import com.smallpeanut.model.SleepRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface SleepRecordRepository extends JpaRepository<SleepRecord, Long> {
    List<SleepRecord> findAllByOrderByFellAsleepAtDesc();

    @Query("SELECT s FROM SleepRecord s WHERE s.fellAsleepAt >= :since")
    List<SleepRecord> findAllSince(@Param("since") LocalDateTime since);
}
