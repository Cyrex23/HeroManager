package com.heromanager.repository;

import com.heromanager.entity.HeroTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HeroTemplateRepository extends JpaRepository<HeroTemplate, Long> {
    Optional<HeroTemplate> findByName(String name);
    Optional<HeroTemplate> findByIsStarterTrue();
}
