package com.heromanager.repository;

import com.heromanager.entity.WeaponSpell;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WeaponSpellRepository extends JpaRepository<WeaponSpell, Long> {
    List<WeaponSpell> findByItemTemplateId(Long itemTemplateId);
}
