package com.heromanager.repository;
import com.heromanager.entity.AbilitySpell;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AbilitySpellRepository extends JpaRepository<AbilitySpell, Long> {
    List<AbilitySpell> findByAbilityTemplateId(Long abilityTemplateId);
    List<AbilitySpell> findByAbilityTemplate(com.heromanager.entity.AbilityTemplate abilityTemplate);
    List<AbilitySpell> findByAbilityTemplateOrderById(com.heromanager.entity.AbilityTemplate abilityTemplate);
}
