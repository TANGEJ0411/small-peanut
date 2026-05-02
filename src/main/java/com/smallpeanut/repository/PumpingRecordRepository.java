package com.smallpeanut.repository;

import com.smallpeanut.model.PumpingRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PumpingRecordRepository extends JpaRepository<PumpingRecord, Long> {
    List<PumpingRecord> findAllByOrderByPumpedAtDesc();
}
