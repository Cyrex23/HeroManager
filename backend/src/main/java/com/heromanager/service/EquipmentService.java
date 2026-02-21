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
    private final PlayerRepository playerRepository;

    public EquipmentService(EquippedItemRepository equippedItemRepository,
                            EquippedAbilityRepository equippedAbilityRepository,
                            HeroRepository heroRepository,
                            PlayerRepository playerRepository) {
        this.equippedItemRepository = equippedItemRepository;
        this.equippedAbilityRepository = equippedAbilityRepository;
        this.heroRepository = heroRepository;
        this.playerRepository = playerRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getHeroEquipment(Long playerId, Long heroId) {
        Hero hero = heroRepository.findById(heroId)
                .orElseThrow(() -> new EquipmentException("HERO_NOT_FOUND", "Hero not found."));
        if (!hero.getPlayerId().equals(playerId)) {
            throw new EquipmentException("HERO_NOT_FOUND", "Hero not found.");
        }

        // Build combined 3 slots (items + abilities share slots 1-3)
        List<Map<String, Object>> slots = new ArrayList<>();
        for (int slot = 1; slot <= 3; slot++) {
            final Integer s = slot;
            Optional<EquippedItem> item = equippedItemRepository.findByHeroIdAndSlotNumber(heroId, s);
            if (item.isPresent()) {
                EquippedItem ei = item.get();
                ItemTemplate t = ei.getItemTemplate();
                Map<String, Object> slotMap = new LinkedHashMap<>();
                slotMap.put("slotNumber", slot);
                slotMap.put("type", "item");
                slotMap.put("id", ei.getId());
                slotMap.put("templateId", t.getId());
                slotMap.put("name", t.getName());
                slotMap.put("bonuses", buildItemBonuses(t));
                slotMap.put("sellPrice", (int) Math.floor(t.getCost() * 0.75));
                slotMap.put("copies", equippedItemRepository.countByPlayerAndItemTemplate(playerId, t.getId()));
                slots.add(slotMap);
                continue;
            }
            Optional<EquippedAbility> ability = equippedAbilityRepository.findByHeroIdAndSlotNumber(heroId, s);
            if (ability.isPresent()) {
                EquippedAbility ea = ability.get();
                AbilityTemplate at = ea.getAbilityTemplate();
                Map<String, Object> slotMap = new LinkedHashMap<>();
                slotMap.put("slotNumber", slot);
                slotMap.put("type", "ability");
                slotMap.put("id", ea.getId());
                slotMap.put("templateId", at.getId());
                slotMap.put("name", at.getName());
                slotMap.put("bonuses", buildAbilityBonuses(at));
                slotMap.put("sellPrice", null);
                slotMap.put("copies", equippedAbilityRepository.countByPlayerAndAbilityTemplate(playerId, at.getId()));
                Map<String, Object> spellData = buildSpellData(at);
                if (spellData != null) slotMap.put("spell", spellData);
                slots.add(slotMap);
                continue;
            }
            Map<String, Object> empty = new LinkedHashMap<>();
            empty.put("slotNumber", slot);
            empty.put("type", null);
            empty.put("id", null);
            empty.put("templateId", null);
            empty.put("name", null);
            empty.put("bonuses", null);
            empty.put("sellPrice", null);
            slots.add(empty);
        }

        // Inventory items (unequipped — no hero assigned)
        List<EquippedItem> inventoryItems = equippedItemRepository.findByPlayerIdAndHeroIdIsNull(playerId);
        List<Map<String, Object>> inventoryList = new ArrayList<>();
        for (EquippedItem ei : inventoryItems) {
            ItemTemplate t = ei.getItemTemplate();
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("equippedItemId", ei.getId());
            entry.put("itemTemplateId", t.getId());
            entry.put("name", t.getName());
            entry.put("bonuses", buildItemBonuses(t));
            entry.put("sellPrice", (int) Math.floor(t.getCost() * 0.75));
            entry.put("copies", equippedItemRepository.countByPlayerAndItemTemplate(playerId, t.getId()));
            inventoryList.add(entry);
        }

        // Hero abilities (all owned for this hero, includes slotNumber if set)
        List<EquippedAbility> heroAbilities = equippedAbilityRepository.findByHeroId(heroId);
        List<Map<String, Object>> abilityList = new ArrayList<>();
        for (EquippedAbility ea : heroAbilities) {
            AbilityTemplate at = ea.getAbilityTemplate();
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("equippedAbilityId", ea.getId());
            entry.put("abilityTemplateId", at.getId());
            entry.put("name", at.getName());
            entry.put("tier", at.getTier());
            entry.put("bonuses", buildAbilityBonuses(at));
            entry.put("slotNumber", ea.getSlotNumber());
            entry.put("copies", equippedAbilityRepository.countByPlayerAndAbilityTemplate(playerId, at.getId()));
            Map<String, Object> spellData = buildSpellData(at);
            if (spellData != null) entry.put("spell", spellData);
            abilityList.add(entry);
        }

        return Map.of(
                "heroId", heroId,
                "heroName", hero.getTemplate().getDisplayName(),
                "slots", slots,
                "inventoryItems", inventoryList,
                "heroAbilities", abilityList
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getPlayerInventory(Long playerId) {
        List<EquippedItem> items = equippedItemRepository.findByPlayerIdAndHeroIdIsNull(playerId);
        List<Map<String, Object>> itemList = new ArrayList<>();
        for (EquippedItem ei : items) {
            ItemTemplate t = ei.getItemTemplate();
            itemList.add(Map.of(
                    "equippedItemId", ei.getId(),
                    "itemTemplateId", t.getId(),
                    "name", t.getName(),
                    "bonuses", buildItemBonuses(t),
                    "sellPrice", (int) Math.floor(t.getCost() * 0.75)
            ));
        }
        return Map.of("items", itemList);
    }

    @Transactional
    public Map<String, Object> equipItemToSlot(Long playerId, Long equippedItemId, Long heroId, int slotNumber) {
        EquippedItem ei = equippedItemRepository.findById(equippedItemId)
                .orElseThrow(() -> new EquipmentException("ITEM_NOT_FOUND", "Item not found in inventory."));
        if (!playerId.equals(ei.getPlayerId())) {
            throw new EquipmentException("ITEM_NOT_FOUND", "Item not found in inventory.");
        }
        if (ei.getHeroId() != null) {
            throw new EquipmentException("ALREADY_EQUIPPED", "Item is already equipped to a hero. Unequip it first.");
        }

        Hero hero = heroRepository.findById(heroId)
                .orElseThrow(() -> new EquipmentException("HERO_NOT_FOUND", "Hero not found."));
        if (!hero.getPlayerId().equals(playerId)) {
            throw new EquipmentException("HERO_NOT_FOUND", "Hero not found.");
        }
        if (slotNumber < 1 || slotNumber > 3) {
            throw new EquipmentException("INVALID_SLOT", "Slot must be 1-3.");
        }

        // Check hero doesn't already have this item
        if (equippedItemRepository.findByHeroIdAndItemTemplateId(heroId, ei.getItemTemplateId()).isPresent()) {
            throw new EquipmentException("DUPLICATE_ITEM_ON_HERO",
                    hero.getTemplate().getDisplayName() + " already has " + ei.getItemTemplate().getName() + " equipped.");
        }

        // Check slot not taken by item
        if (equippedItemRepository.findByHeroIdAndSlotNumber(heroId, slotNumber).isPresent()) {
            throw new EquipmentException("SLOT_OCCUPIED", "Slot " + slotNumber + " is already occupied.");
        }
        // Check slot not taken by ability
        if (equippedAbilityRepository.findByHeroIdAndSlotNumber(heroId, slotNumber).isPresent()) {
            throw new EquipmentException("SLOT_OCCUPIED", "Slot " + slotNumber + " is already occupied.");
        }

        ei.setHeroId(heroId);
        ei.setSlotNumber(slotNumber);
        equippedItemRepository.save(ei);

        return Map.of("message", ei.getItemTemplate().getName() + " equipped to slot " + slotNumber + ".");
    }

    @Transactional
    public Map<String, Object> unequipItemFromSlot(Long playerId, Long heroId, int slotNumber) {
        Hero hero = heroRepository.findById(heroId)
                .orElseThrow(() -> new EquipmentException("HERO_NOT_FOUND", "Hero not found."));
        if (!hero.getPlayerId().equals(playerId)) {
            throw new EquipmentException("HERO_NOT_FOUND", "Hero not found.");
        }

        EquippedItem ei = equippedItemRepository.findByHeroIdAndSlotNumber(heroId, slotNumber)
                .orElseThrow(() -> new EquipmentException("NO_ITEM", "No item in slot " + slotNumber + "."));

        String itemName = ei.getItemTemplate().getName();
        ei.setHeroId(null);
        ei.setSlotNumber(null);
        equippedItemRepository.save(ei);

        return Map.of("message", itemName + " returned to inventory.");
    }

    @Transactional
    public Map<String, Object> equipAbilityToSlot(Long playerId, Long equippedAbilityId, int slotNumber) {
        EquippedAbility ea = equippedAbilityRepository.findById(equippedAbilityId)
                .orElseThrow(() -> new EquipmentException("ABILITY_NOT_FOUND", "Ability not found."));
        if (!playerId.equals(ea.getPlayerId())) {
            throw new EquipmentException("ABILITY_NOT_FOUND", "Ability not found.");
        }
        if (ea.getSlotNumber() != null) {
            throw new EquipmentException("ALREADY_SLOTTED", "Ability is already in a slot. Unslot it first.");
        }

        Long heroId = ea.getHeroId();
        if (slotNumber < 1 || slotNumber > 3) {
            throw new EquipmentException("INVALID_SLOT", "Slot must be 1-3.");
        }

        // Check slot not taken by item
        if (equippedItemRepository.findByHeroIdAndSlotNumber(heroId, slotNumber).isPresent()) {
            throw new EquipmentException("SLOT_OCCUPIED", "Slot " + slotNumber + " is already occupied.");
        }
        // Check slot not taken by another ability
        if (equippedAbilityRepository.findByHeroIdAndSlotNumber(heroId, slotNumber).isPresent()) {
            throw new EquipmentException("SLOT_OCCUPIED", "Slot " + slotNumber + " is already occupied.");
        }

        ea.setSlotNumber(slotNumber);
        equippedAbilityRepository.save(ea);

        return Map.of("message", ea.getAbilityTemplate().getName() + " slotted at position " + slotNumber + ".");
    }

    @Transactional
    public Map<String, Object> unequipAbilityFromSlot(Long playerId, Long heroId, int slotNumber) {
        Hero hero = heroRepository.findById(heroId)
                .orElseThrow(() -> new EquipmentException("HERO_NOT_FOUND", "Hero not found."));
        if (!hero.getPlayerId().equals(playerId)) {
            throw new EquipmentException("HERO_NOT_FOUND", "Hero not found.");
        }

        EquippedAbility ea = equippedAbilityRepository.findByHeroIdAndSlotNumber(heroId, slotNumber)
                .orElseThrow(() -> new EquipmentException("NO_ABILITY", "No ability in slot " + slotNumber + "."));

        String abilityName = ea.getAbilityTemplate().getName();
        ea.setSlotNumber(null);
        equippedAbilityRepository.save(ea);

        return Map.of("message", abilityName + " unslotted from " + hero.getTemplate().getDisplayName() + ".");
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getFullInventory(Long playerId) {
        List<EquippedItem> allItems = equippedItemRepository.findByPlayerId(playerId);
        Map<Long, String> heroNameCache = new HashMap<>();

        List<Map<String, Object>> itemList = new ArrayList<>();
        for (EquippedItem ei : allItems) {
            ItemTemplate t = ei.getItemTemplate();
            if (t == null) continue;
            String heroName = null;
            if (ei.getHeroId() != null) {
                heroName = heroNameCache.computeIfAbsent(ei.getHeroId(), id ->
                        heroRepository.findById(id)
                                .filter(h -> h.getTemplate() != null)
                                .map(h -> h.getTemplate().getDisplayName())
                                .orElse("Unknown"));
            }
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("equippedItemId", ei.getId());
            entry.put("itemTemplateId", t.getId());
            entry.put("name", t.getName());
            entry.put("bonuses", buildItemBonuses(t));
            entry.put("sellPrice", (int) Math.floor(t.getCost() * 0.75));
            entry.put("equippedToHeroId", ei.getHeroId());
            entry.put("equippedToHeroName", heroName);
            entry.put("slotNumber", ei.getSlotNumber());
            itemList.add(entry);
        }

        List<EquippedAbility> allAbilities = equippedAbilityRepository.findByPlayerId(playerId);
        List<Map<String, Object>> abilityList = new ArrayList<>();
        for (EquippedAbility ea : allAbilities) {
            AbilityTemplate at = ea.getAbilityTemplate();
            if (at == null) continue;
            String heroName = heroNameCache.computeIfAbsent(ea.getHeroId(), id ->
                    heroRepository.findById(id)
                            .filter(h -> h.getTemplate() != null)
                            .map(h -> h.getTemplate().getDisplayName())
                            .orElse("Unknown"));
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("equippedAbilityId", ea.getId());
            entry.put("abilityTemplateId", at.getId());
            entry.put("name", at.getName());
            entry.put("tier", at.getTier());
            entry.put("bonuses", buildAbilityBonuses(at));
            entry.put("sellPrice", (int) Math.floor(at.getCost() * 0.75));
            entry.put("heroId", ea.getHeroId());
            entry.put("heroName", heroName);
            entry.put("slotNumber", ea.getSlotNumber());
            Map<String, Object> spellData = buildSpellData(at);
            if (spellData != null) entry.put("spell", spellData);
            abilityList.add(entry);
        }

        return Map.of("items", itemList, "abilities", abilityList);
    }

    @Transactional
    public Map<String, Object> sellItem(Long playerId, Long equippedItemId) {
        EquippedItem ei = equippedItemRepository.findById(equippedItemId)
                .orElseThrow(() -> new EquipmentException("ITEM_NOT_FOUND", "Item not found."));
        if (!playerId.equals(ei.getPlayerId())) {
            throw new EquipmentException("ITEM_NOT_FOUND", "Item not found.");
        }

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
    public Map<String, Object> sellAbility(Long playerId, Long equippedAbilityId) {
        EquippedAbility ea = equippedAbilityRepository.findById(equippedAbilityId)
                .orElseThrow(() -> new EquipmentException("ABILITY_NOT_FOUND", "Ability not found."));

        // Verify ownership through the hero
        heroRepository.findById(ea.getHeroId())
                .filter(h -> h.getPlayerId().equals(playerId))
                .orElseThrow(() -> new EquipmentException("ABILITY_NOT_FOUND", "Ability not found."));

        AbilityTemplate template = ea.getAbilityTemplate();
        int sellPrice = (int) Math.floor(template.getCost() * 0.75);

        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new EquipmentException("PLAYER_NOT_FOUND", "Player not found."));
        player.setGold(player.getGold() + sellPrice);
        playerRepository.save(player);

        equippedAbilityRepository.delete(ea);

        return Map.of(
                "message", template.getName() + " sold for " + sellPrice + " gold.",
                "goldEarned", sellPrice,
                "goldTotal", player.getGold()
        );
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

    private Map<String, Object> buildSpellData(AbilityTemplate t) {
        if (t.getSpellName() == null || t.getSpellName().isBlank()) return null;
        Map<String, Object> spellBonuses = new LinkedHashMap<>();
        if (t.getSpellBonusPa() != 0) spellBonuses.put("physicalAttack", t.getSpellBonusPa());
        if (t.getSpellBonusMp() != 0) spellBonuses.put("magicPower", t.getSpellBonusMp());
        if (t.getSpellBonusDex() != 0) spellBonuses.put("dexterity", t.getSpellBonusDex());
        if (t.getSpellBonusElem() != 0) spellBonuses.put("element", t.getSpellBonusElem());
        if (t.getSpellBonusMana() != 0) spellBonuses.put("mana", t.getSpellBonusMana());
        if (t.getSpellBonusStam() != 0) spellBonuses.put("stamina", t.getSpellBonusStam());
        Map<String, Object> spell = new LinkedHashMap<>();
        spell.put("name", t.getSpellName());
        spell.put("manaCost", t.getSpellManaCost());
        spell.put("trigger", t.getSpellTrigger());
        spell.put("chance", t.getSpellChance());
        spell.put("bonuses", spellBonuses);
        return spell;
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
