package com.heromanager.repository;

import com.heromanager.entity.TeamSetup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamSetupRepository extends JpaRepository<TeamSetup, Long> {
    List<TeamSetup> findByPlayerIdOrderBySetupIndex(Long playerId);
    Optional<TeamSetup> findByPlayerIdAndActiveTrue(Long playerId);
    Optional<TeamSetup> findByPlayerIdAndSetupIndex(Long playerId, int setupIndex);
}
