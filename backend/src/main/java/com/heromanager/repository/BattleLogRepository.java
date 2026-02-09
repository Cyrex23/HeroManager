package com.heromanager.repository;

import com.heromanager.entity.BattleLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface BattleLogRepository extends JpaRepository<BattleLog, Long> {

    @Query("SELECT b FROM BattleLog b WHERE b.challengerId = :playerId OR b.defenderId = :playerId ORDER BY b.createdAt DESC")
    Page<BattleLog> findByPlayerIdOrderByCreatedAtDesc(Long playerId, Pageable pageable);

    @Query("SELECT b FROM BattleLog b WHERE b.challengerId = :challengerId AND b.defenderId = :defenderId AND b.returnChallengeUsed = false ORDER BY b.createdAt DESC")
    List<BattleLog> findReturnChallengeOpportunities(Long challengerId, Long defenderId);

    Optional<BattleLog> findByIdAndChallengerIdOrIdAndDefenderId(Long id1, Long challengerId, Long id2, Long defenderId);
}
