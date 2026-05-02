package com.smallpeanut.repository;

import com.smallpeanut.model.SleepRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SleepRecordRepository extends JpaRepository<SleepRecord, Long> {
    List<SleepRecord> findAllByOrderByFellAsleepAtDesc();
}
