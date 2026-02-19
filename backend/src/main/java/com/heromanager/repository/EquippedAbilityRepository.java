package com.heromanager.repository;

import com.heromanager.entity.EquippedAbility;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EquippedAbilityRepository extends JpaRepository<EquippedAbility, Long> {

    List<EquippedAbility> findByHeroId(Long heroId);

    Optional<EquippedAbility> findByHeroIdAndAbilityTemplateId(Long heroId, Long abilityTemplateId);
}
