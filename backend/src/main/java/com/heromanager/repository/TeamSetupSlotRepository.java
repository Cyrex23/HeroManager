package com.heromanager.repository;

import com.heromanager.entity.TeamSetupSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface TeamSetupSlotRepository extends JpaRepository<TeamSetupSlot, Long> {
    List<TeamSetupSlot> findBySetupId(Long setupId);

    @Modifying
    @Transactional
    @Query("DELETE FROM TeamSetupSlot s WHERE s.setupId = :setupId")
    void deleteBySetupId(@Param("setupId") Long setupId);
}
