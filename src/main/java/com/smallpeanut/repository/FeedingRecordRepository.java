package com.smallpeanut.repository;

import com.smallpeanut.model.FeedingRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface FeedingRecordRepository extends JpaRepository<FeedingRecord, Long> {
    List<FeedingRecord> findAllByOrderByStartedAtDesc();
    List<FeedingRecord> findAllByStartedAtBetweenOrderByStartedAtDesc(LocalDateTime from, LocalDateTime to);
}
