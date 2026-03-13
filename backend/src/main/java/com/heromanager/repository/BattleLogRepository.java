package com.heromanager.repository;

import com.heromanager.entity.BattleLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
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

    @Query("SELECT COUNT(b) FROM BattleLog b WHERE b.challengerId = :challengerId AND b.defenderId = :defenderId AND b.isReturnChallenge = false AND b.createdAt >= :since")
    long countDirectChallengesTo(@Param("challengerId") Long challengerId, @Param("defenderId") Long defenderId, @Param("since") LocalDateTime since);

    @Query("SELECT COUNT(b) FROM BattleLog b WHERE b.challengerId = :challengerId AND b.defenderId = :defenderId AND b.isReturnChallenge = true")
    long countReturnsDone(@Param("challengerId") Long challengerId, @Param("defenderId") Long defenderId);

    // Most recent N direct challenges received: defenderId received from challengerId
    @Query("SELECT b FROM BattleLog b WHERE b.defenderId = :defenderId AND b.challengerId = :challengerId AND b.isReturnChallenge = false ORDER BY b.createdAt DESC")
    List<BattleLog> findMostRecentReceivedChallenges(@Param("defenderId") Long defenderId, @Param("challengerId") Long challengerId, Pageable pageable);

    // Count return battles sent by me (challengerId) to opponent (defenderId) since a given time
    @Query("SELECT COUNT(b) FROM BattleLog b WHERE b.challengerId = :challengerId AND b.defenderId = :defenderId AND b.isReturnChallenge = true AND b.createdAt >= :since")
    long countReturnsSentSince(@Param("challengerId") Long challengerId, @Param("defenderId") Long defenderId, @Param("since") LocalDateTime since);

    // Dashboard stats
    @Query("SELECT COUNT(b) FROM BattleLog b WHERE (b.challengerId = :pid OR b.defenderId = :pid) AND b.createdAt >= :since")
    long countBattlesSince(@Param("pid") Long pid, @Param("since") LocalDateTime since);

    @Query("SELECT COUNT(b) FROM BattleLog b WHERE b.winnerId = :pid AND b.createdAt >= :since")
    long countWinsSince(@Param("pid") Long pid, @Param("since") LocalDateTime since);

    @Query("SELECT COALESCE(SUM(b.challengerGoldEarned), 0) FROM BattleLog b WHERE b.challengerId = :pid AND b.createdAt >= :since")
    long sumChallengerGoldSince(@Param("pid") Long pid, @Param("since") LocalDateTime since);

    @Query("SELECT COALESCE(SUM(b.defenderGoldEarned), 0) FROM BattleLog b WHERE b.defenderId = :pid AND b.createdAt >= :since")
    long sumDefenderGoldSince(@Param("pid") Long pid, @Param("since") LocalDateTime since);

    @Query("SELECT COALESCE(SUM(b.challengerGoldEarned), 0) FROM BattleLog b WHERE b.challengerId = :pid")
    long sumChallengerGoldAllTime(@Param("pid") Long pid);

    @Query("SELECT COALESCE(SUM(b.defenderGoldEarned), 0) FROM BattleLog b WHERE b.defenderId = :pid")
    long sumDefenderGoldAllTime(@Param("pid") Long pid);
}
