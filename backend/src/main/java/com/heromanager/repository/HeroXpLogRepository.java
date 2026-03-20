package com.heromanager.repository;

import com.heromanager.entity.HeroXpLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface HeroXpLogRepository extends JpaRepository<HeroXpLog, Long> {

    @Query("SELECT COALESCE(SUM(x.xpGained), 0) FROM HeroXpLog x WHERE x.heroId = :heroId AND x.createdAt >= :since")
    long sumXpSince(@Param("heroId") Long heroId, @Param("since") LocalDateTime since);

    @Query("SELECT COALESCE(SUM(x.xpGained), 0) FROM HeroXpLog x WHERE x.heroId = :heroId")
    long sumXpAllTime(@Param("heroId") Long heroId);
}
