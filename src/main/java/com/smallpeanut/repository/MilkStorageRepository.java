package com.smallpeanut.repository;

import com.smallpeanut.model.MilkStorage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MilkStorageRepository extends JpaRepository<MilkStorage, Long> {
    List<MilkStorage> findAllByOrderByStoredAtDesc();
}
