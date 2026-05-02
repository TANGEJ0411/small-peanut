package com.smallpeanut.repository;

import com.smallpeanut.model.DiaperRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DiaperRecordRepository extends JpaRepository<DiaperRecord, Long> {
    List<DiaperRecord> findAllByOrderByRecordedAtDesc();
}
