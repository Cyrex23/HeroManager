package com.heromanager.repository;

import com.heromanager.entity.TeamSetupHeroEquipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface TeamSetupHeroEquipmentRepository extends JpaRepository<TeamSetupHeroEquipment, Long> {
    List<TeamSetupHeroEquipment> findBySetupId(Long setupId);
    List<TeamSetupHeroEquipment> findBySetupIdAndHeroId(Long setupId, Long heroId);

    @Modifying
    @Transactional
    @Query("DELETE FROM TeamSetupHeroEquipment e WHERE e.setupId = :setupId")
    void deleteBySetupId(@Param("setupId") Long setupId);
}
