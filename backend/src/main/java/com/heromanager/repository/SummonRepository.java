package com.heromanager.repository;

import com.heromanager.entity.Summon;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SummonRepository extends JpaRepository<Summon, Long> {
    List<Summon> findByPlayerId(Long playerId);
    Optional<Summon> findByPlayerIdAndTemplateId(Long playerId, Long templateId);
    boolean existsByPlayerIdAndTemplateId(Long playerId, Long templateId);
}
