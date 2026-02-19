package com.heromanager.repository;

import com.heromanager.entity.EquippedItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface EquippedItemRepository extends JpaRepository<EquippedItem, Long> {

    List<EquippedItem> findByHeroId(Long heroId);

    Optional<EquippedItem> findByHeroIdAndSlotNumber(Long heroId, int slotNumber);

    Optional<EquippedItem> findByHeroIdAndItemTemplateId(Long heroId, Long itemTemplateId);

    @Query("SELECT COUNT(e) FROM EquippedItem e WHERE e.heroId IN " +
           "(SELECT h.id FROM Hero h WHERE h.playerId = :playerId) " +
           "AND e.itemTemplateId = :itemTemplateId")
    long countByPlayerAndItemTemplate(Long playerId, Long itemTemplateId);
}
