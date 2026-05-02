package com.smallpeanut.repository;

import com.smallpeanut.model.GrowthRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GrowthRecordRepository extends JpaRepository<GrowthRecord, Long> {
    List<GrowthRecord> findAllByOrderByRecordedAtDesc();
}
