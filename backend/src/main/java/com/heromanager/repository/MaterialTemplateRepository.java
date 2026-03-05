package com.heromanager.repository;

import com.heromanager.entity.MaterialTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MaterialTemplateRepository extends JpaRepository<MaterialTemplate, Long> {
    List<MaterialTemplate> findAllByOrderByTierAscNameAsc();
    List<MaterialTemplate> findByTierLessThanEqual(int tier);
}
