package com.heromanager.repository;

import com.heromanager.entity.EquippedAbility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface EquippedAbilityRepository extends JpaRepository<EquippedAbility, Long> {

    @Query("SELECT e FROM EquippedAbility e WHERE e.heroId IN (SELECT h.id FROM Hero h WHERE h.playerId = :playerId)")
    List<EquippedAbility> findByPlayerId(Long playerId);

    List<EquippedAbility> findByHeroId(Long heroId);

    List<EquippedAbility> findByHeroIdAndSlotNumberIsNull(Long heroId);

    Optional<EquippedAbility> findByHeroIdAndAbilityTemplateId(Long heroId, Long abilityTemplateId);

    Optional<EquippedAbility> findByHeroIdAndSlotNumber(Long heroId, Integer slotNumber);

    List<EquippedAbility> findByHeroIdAndSlotNumberIsNotNull(Long heroId);

    @Query("SELECT COUNT(e) FROM EquippedAbility e WHERE e.heroId IN " +
           "(SELECT h.id FROM Hero h WHERE h.playerId = :playerId) " +
           "AND e.abilityTemplateId = :abilityTemplateId")
    long countByPlayerAndAbilityTemplate(Long playerId, Long abilityTemplateId);
}
