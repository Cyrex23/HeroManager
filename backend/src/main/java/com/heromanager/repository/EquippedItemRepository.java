package com.heromanager.repository;

import com.heromanager.entity.EquippedItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface EquippedItemRepository extends JpaRepository<EquippedItem, Long> {
    List<EquippedItem> findByHeroId(Long heroId);
    Optional<EquippedItem> findByHeroIdAndSlotNumber(Long heroId, Integer slotNumber);
    Optional<EquippedItem> findByHeroIdAndItemTemplateId(Long heroId, Long itemTemplateId);
    List<EquippedItem> findByHeroIdIn(List<Long> heroIds);
}
