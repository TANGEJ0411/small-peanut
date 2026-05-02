package com.smallpeanut.repository;

import com.smallpeanut.model.StatusTag;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StatusTagRepository extends JpaRepository<StatusTag, Long> {
    List<StatusTag> findAllByOrderByRecordedAtDesc();
}
