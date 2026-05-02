package com.smallpeanut.repository;

import com.smallpeanut.model.FeedingRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FeedingRecordRepository extends JpaRepository<FeedingRecord, Long> {
    List<FeedingRecord> findAllByOrderByStartedAtDesc();
}
