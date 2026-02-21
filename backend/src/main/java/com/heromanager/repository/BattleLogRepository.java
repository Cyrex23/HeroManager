package com.heromanager.repository;

import com.heromanager.entity.BattleLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface BattleLogRepository extends JpaRepository<BattleLog, Long> {

    @Query("SELECT b FROM BattleLog b WHERE b.challengerId = ?1 OR b.defenderId = ?1 ORDER BY b.createdAt DESC")
    Page<BattleLog> findByPlayerInvolved(Long playerId, Pageable pageable);

    @Query("SELECT b FROM BattleLog b WHERE b.challengerId = ?1 AND b.defenderId = ?2 AND b.returnChallengeUsed = false ORDER BY b.createdAt DESC")
    List<BattleLog> findPendingReturnChallenges(Long challengerId, Long defenderId);

    @Query("SELECT COUNT(b) FROM BattleLog b WHERE b.challengerId = ?1 OR b.defenderId = ?1")
    long countBattles(Long playerId);

    @Query("SELECT COUNT(b) FROM BattleLog b WHERE b.winnerId = ?1")
    long countWins(Long playerId);
}
