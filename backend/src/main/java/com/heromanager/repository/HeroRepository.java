package com.heromanager.repository;

import com.heromanager.entity.Hero;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HeroRepository extends JpaRepository<Hero, Long> {
    List<Hero> findByPlayerId(Long playerId);
    Optional<Hero> findByPlayerIdAndTemplateId(Long playerId, Long templateId);
    boolean existsByPlayerIdAndTemplateId(Long playerId, Long templateId);
    Optional<Hero> findByIdAndPlayerId(Long id, Long playerId);
}
