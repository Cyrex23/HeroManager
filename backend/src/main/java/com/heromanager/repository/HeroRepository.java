package com.heromanager.repository;

import com.heromanager.entity.Hero;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface HeroRepository extends JpaRepository<Hero, Long> {
    List<Hero> findByPlayerId(Long playerId);
    Optional<Hero> findByPlayerIdAndTemplateId(Long playerId, Long templateId);
    boolean existsByPlayerIdAndTemplateId(Long playerId, Long templateId);
    Optional<Hero> findByIdAndPlayerId(Long id, Long playerId);

    @Query("SELECT h FROM Hero h JOIN FETCH h.template WHERE h.template IS NOT NULL ORDER BY h.level DESC, h.clashesWon DESC")
    List<Hero> findTopByLevel(Pageable pageable);
}
