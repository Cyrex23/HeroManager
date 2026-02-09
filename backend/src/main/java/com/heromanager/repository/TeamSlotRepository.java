package com.heromanager.repository;

import com.heromanager.entity.TeamSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TeamSlotRepository extends JpaRepository<TeamSlot, Long> {
    List<TeamSlot> findByPlayerId(Long playerId);
    Optional<TeamSlot> findByPlayerIdAndSlotNumber(Long playerId, Integer slotNumber);
    Optional<TeamSlot> findByPlayerIdAndHeroId(Long playerId, Long heroId);
    Optional<TeamSlot> findByPlayerIdAndSummonId(Long playerId, Long summonId);
    void deleteByPlayerIdAndSlotNumber(Long playerId, Integer slotNumber);
}
