package com.heromanager.repository;

import com.heromanager.entity.AbilityTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AbilityTemplateRepository extends JpaRepository<AbilityTemplate, Long> {
    List<AbilityTemplate> findByHeroTemplateId(Long heroTemplateId);
    Optional<AbilityTemplate> findByNameAndHeroTemplateId(String name, Long heroTemplateId);
}
