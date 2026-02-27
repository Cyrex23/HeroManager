package com.heromanager.repository;

import com.heromanager.entity.TeamSetupSlot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeamSetupSlotRepository extends JpaRepository<TeamSetupSlot, Long> {
    List<TeamSetupSlot> findBySetupId(Long setupId);
    void deleteBySetupId(Long setupId);
}
