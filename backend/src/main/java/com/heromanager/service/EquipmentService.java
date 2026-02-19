package com.heromanager.service;

import com.heromanager.entity.*;
import com.heromanager.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class EquipmentService {

    private final EquippedItemRepository equippedItemRepository;
    private final EquippedAbilityRepository equippedAbilityRepository;
    private final HeroRepository heroRepository;
    private final ItemTemplateRepository itemTemplateRepository;
    private final AbilityTemplateRepository abilityTemplateRepository;
    private final PlayerRepository playerRepository;

    public EquipmentService(EquippedItemRepository equippedItemRepository,
                            EquippedAbilityRepository equippedAbilityRepository,
                            HeroRepository heroRepository,
                            ItemTemplateRepository itemTemplateRepository,
                            AbilityTemplateRepository abilityTemplateRepository,
                            PlayerRepository playerRepository) {
        this.equippedItemRepository = equippedItemRepository;
        this.equippedAbilityRepository = equippedAbilityRepository;
        this.heroRepository = heroRepository;
        this.itemTemplateRepository = itemTemplateRepository;
        this.abilityTemplateRepository = abilityTemplateRepository;
        this.playerRepository = playerRepository;
    }

    public Map<String, Object> getHeroEquipment(Long playerId, Long heroId) {
        Hero hero = heroRepository.findById(heroId)
                .orElseThrow(() -> new EquipmentException("HERO_NOT_FOUND", "Hero not found."));
        if (!hero.getPlayerId().equals(playerId)) {
            throw new EquipmentException("HERO_NOT_FOUND", "Hero not found.");
        }

        List<EquippedItem> items = equippedItemRepository.findByHeroId(heroId);
        List<EquippedAbility> abilities = equippedAbilityRepository.findByHeroId(heroId);

        List<Map<String, Object>> itemSlots = new ArrayList<>();
        for (int slot = 1; slot <= 3; slot++) {
            final int s = slot;
            Optional<EquippedItem> equipped = items.stream()
                    .filter(i -> i.getSlotNumber() == s).findFirst();
            if (equipped.isPresent()) {
                EquippedItem ei = equipped.get();
                ItemTemplate t = ei.getItemTemplate();
                itemSlots.add(Map.of(
                        "slotNumber", slot,
                        "equippedItemId", ei.getId(),
                        "itemTemplateId", t.getId(),
                        "name", t.getName(),
                        "bonuses", buildItemBonuses(t),
                        "sellPrice", (int) Math.floor(t.getCost() * 0.75)
                ));
            } else {
                Map<String, Object> empty = new LinkedHashMap<>();
                empty.put("slotNumber", slot);
                empty.put("equippedItemId", null);
                empty.put("itemTemplateId", null);
                empty.put("name", null);
                empty.put("bonuses", null);
                empty.put("sellPrice", null);
                itemSlots.add(empty);
            }
        }

        List<Map<String, Object>> abilityList = new ArrayList<>();
        for (EquippedAbility ea : abilities) {
            AbilityTemplate at = ea.getAbilityTemplate();
            abilityList.add(Map.of(
                    "equippedAbilityId", ea.getId(),
                    "abilityTemplateId", at.getId(),
                    "name", at.getName(),
                    "tier", at.getTier(),
                    "bonuses", buildAbilityBonuses(at)
            ));
        }

        return Map.of(
                "heroId", heroId,
                "heroName", hero.getTemplate().getDisplayName(),
                "items", itemSlots,
                "abilities", abilityList
        );
    }

    @Transactional
    public Map<String, Object> equipItem(Long playerId, Long heroId, Long itemTemplateId, int slotNumber) {
        Hero hero = heroRepository.findById(heroId)
                .orElseThrow(() -> new EquipmentException("HERO_NOT_FOUND", "Hero not found."));
        if (!hero.getPlayerId().equals(playerId)) {
            throw new EquipmentException("HERO_NOT_FOUND", "Hero not found.");
        }
        ItemTemplate template = itemTemplateRepository.findById(itemTemplateId)
                .orElseThrow(() -> new EquipmentException("ITEM_NOT_FOUND", "Item not found."));

        if (slotNumber < 1 || slotNumber > 3) {
            throw new EquipmentException("INVALID_SLOT", "Item slot must be 1-3.");
        }

        // Check slot not occupied
        if (equippedItemRepository.findByHeroIdAndSlotNumber(heroId, slotNumber).isPresent()) {
            throw new EquipmentException("SLOT_OCCUPIED",
                    "Slot " + slotNumber + " already has an item. Unequip it first.");
        }

        // Check no duplicate item on this hero
        if (equippedItemRepository.findByHeroIdAndItemTemplateId(heroId, itemTemplateId).isPresent()) {
            throw new EquipmentException("DUPLICATE_ITEM_ON_HERO",
                    hero.getTemplate().getDisplayName() + " already has " + template.getName() + " equipped.");
        }

        // Check team-wide limit (max 3 of same item)
        long teamCount = equippedItemRepository.countByPlayerAndItemTemplate(playerId, itemTemplateId);
        if (teamCount >= 3) {
            throw new EquipmentException("TEAM_ITEM_LIMIT",
                    "Your team already has 3 " + template.getName() + " equipped (maximum).");
        }

        EquippedItem ei = new EquippedItem();
        ei.setHeroId(heroId);
        ei.setItemTemplateId(itemTemplateId);
        ei.setSlotNumber(slotNumber);
        equippedItemRepository.save(ei);

        return Map.of("message", template.getName() + " equipped to slot " + slotNumber + ".");
    }

    @Transactional
    public Map<String, Object> unequipItem(Long playerId, Long heroId, int slotNumber) {
        Hero hero = heroRepository.findById(heroId)
                .orElseThrow(() -> new EquipmentException("HERO_NOT_FOUND", "Hero not found."));
        if (!hero.getPlayerId().equals(playerId)) {
            throw new EquipmentException("HERO_NOT_FOUND", "Hero not found.");
        }

        EquippedItem ei = equippedItemRepository.findByHeroIdAndSlotNumber(heroId, slotNumber)
                .orElseThrow(() -> new EquipmentException("NO_ITEM", "No item in slot " + slotNumber + "."));

        String itemName = ei.getItemTemplate().getName();
        equippedItemRepository.delete(ei);

        return Map.of("message", itemName + " unequipped from " + hero.getTemplate().getDisplayName() + ".");
    }

    @Transactional
    public Map<String, Object> sellItem(Long playerId, Long heroId, int slotNumber) {
        Hero hero = heroRepository.findById(heroId)
                .orElseThrow(() -> new EquipmentException("HERO_NOT_FOUND", "Hero not found."));
        if (!hero.getPlayerId().equals(playerId)) {
            throw new EquipmentException("HERO_NOT_FOUND", "Hero not found.");
        }

        EquippedItem ei = equippedItemRepository.findByHeroIdAndSlotNumber(heroId, slotNumber)
                .orElseThrow(() -> new EquipmentException("NO_ITEM", "No item in slot " + slotNumber + " to sell."));

        ItemTemplate template = ei.getItemTemplate();
        int sellPrice = (int) Math.floor(template.getCost() * 0.75);

        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new EquipmentException("PLAYER_NOT_FOUND", "Player not found."));
        player.setGold(player.getGold() + sellPrice);
        playerRepository.save(player);

        equippedItemRepository.delete(ei);

        return Map.of(
                "message", template.getName() + " sold for " + sellPrice + " gold.",
                "goldEarned", sellPrice,
                "goldTotal", player.getGold()
        );
    }

    @Transactional
    public Map<String, Object> equipAbility(Long playerId, Long heroId, Long abilityTemplateId) {
        Hero hero = heroRepository.findById(heroId)
                .orElseThrow(() -> new EquipmentException("HERO_NOT_FOUND", "Hero not found."));
        if (!hero.getPlayerId().equals(playerId)) {
            throw new EquipmentException("HERO_NOT_FOUND", "Hero not found.");
        }

        AbilityTemplate template = abilityTemplateRepository.findById(abilityTemplateId)
                .orElseThrow(() -> new EquipmentException("ABILITY_NOT_FOUND", "Ability not found."));

        // Check hero template match
        if (!template.getHeroTemplateId().equals(hero.getTemplateId())) {
            throw new EquipmentException("WRONG_HERO",
                    template.getName() + " is not available for " + hero.getTemplate().getDisplayName() + ".");
        }

        // Check no duplicate
        if (equippedAbilityRepository.findByHeroIdAndAbilityTemplateId(heroId, abilityTemplateId).isPresent()) {
            throw new EquipmentException("DUPLICATE_ABILITY",
                    hero.getTemplate().getDisplayName() + " already knows " + template.getName() + ".");
        }

        EquippedAbility ea = new EquippedAbility();
        ea.setHeroId(heroId);
        ea.setAbilityTemplateId(abilityTemplateId);
        equippedAbilityRepository.save(ea);

        return Map.of("message", template.getName() + " learned by " + hero.getTemplate().getDisplayName() + ".");
    }

    @Transactional
    public Map<String, Object> unequipAbility(Long playerId, Long heroId, Long abilityTemplateId) {
        Hero hero = heroRepository.findById(heroId)
                .orElseThrow(() -> new EquipmentException("HERO_NOT_FOUND", "Hero not found."));
        if (!hero.getPlayerId().equals(playerId)) {
            throw new EquipmentException("HERO_NOT_FOUND", "Hero not found.");
        }

        EquippedAbility ea = equippedAbilityRepository.findByHeroIdAndAbilityTemplateId(heroId, abilityTemplateId)
                .orElseThrow(() -> new EquipmentException("ABILITY_NOT_FOUND", "Ability not equipped."));

        String abilityName = ea.getAbilityTemplate().getName();
        equippedAbilityRepository.delete(ea);

        return Map.of("message", abilityName + " unequipped from " + hero.getTemplate().getDisplayName() + ".");
    }

    private Map<String, Object> buildItemBonuses(ItemTemplate t) {
        Map<String, Object> bonuses = new LinkedHashMap<>();
        if (t.getBonusPa() != 0) bonuses.put("physicalAttack", t.getBonusPa());
        if (t.getBonusMp() != 0) bonuses.put("magicPower", t.getBonusMp());
        if (t.getBonusDex() != 0) bonuses.put("dexterity", t.getBonusDex());
        if (t.getBonusElem() != 0) bonuses.put("element", t.getBonusElem());
        if (t.getBonusMana() != 0) bonuses.put("mana", t.getBonusMana());
        if (t.getBonusStam() != 0) bonuses.put("stamina", t.getBonusStam());
        return bonuses;
    }

    private Map<String, Object> buildAbilityBonuses(AbilityTemplate t) {
        Map<String, Object> bonuses = new LinkedHashMap<>();
        if (t.getBonusPa() != 0) bonuses.put("physicalAttack", t.getBonusPa());
        if (t.getBonusMp() != 0) bonuses.put("magicPower", t.getBonusMp());
        if (t.getBonusDex() != 0) bonuses.put("dexterity", t.getBonusDex());
        if (t.getBonusElem() != 0) bonuses.put("element", t.getBonusElem());
        if (t.getBonusMana() != 0) bonuses.put("mana", t.getBonusMana());
        if (t.getBonusStam() != 0) bonuses.put("stamina", t.getBonusStam());
        return bonuses;
    }

    public static class EquipmentException extends RuntimeException {
        private final String errorCode;

        public EquipmentException(String errorCode, String message) {
            super(message);
            this.errorCode = errorCode;
        }

        public String getErrorCode() {
            return errorCode;
        }
    }
}
