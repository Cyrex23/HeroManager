package com.heromanager.repository;

import com.heromanager.entity.Summon;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SummonRepository extends JpaRepository<Summon, Long> {
    List<Summon> findByPlayerId(Long playerId);
    Optional<Summon> findByPlayerIdAndTemplateId(Long playerId, Long templateId);
    boolean existsByPlayerIdAndTemplateId(Long playerId, Long templateId);
    Optional<Summon> findByIdAndPlayerId(Long id, Long playerId);

    @Query("SELECT s FROM Summon s JOIN FETCH s.template WHERE s.template IS NOT NULL ORDER BY s.level DESC, s.currentXp DESC")
    List<Summon> findTopByLevel(Pageable pageable);
}
