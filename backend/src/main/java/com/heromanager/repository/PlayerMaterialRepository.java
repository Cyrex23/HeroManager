package com.heromanager.repository;

import com.heromanager.entity.PlayerMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PlayerMaterialRepository extends JpaRepository<PlayerMaterial, Long> {
    List<PlayerMaterial> findByPlayerId(Long playerId);
    Optional<PlayerMaterial> findByPlayerIdAndMaterialTemplateId(Long playerId, Long materialTemplateId);
    long countByPlayerId(Long playerId);
}
