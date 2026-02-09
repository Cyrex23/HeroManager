package com.heromanager.service;

import com.heromanager.entity.*;
import com.heromanager.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class EquipmentService {

    private final EquippedItemRepository equippedItemRepository;
    private final EquippedAbilityRepository equippedAbilityRepository;
    private final ItemTemplateRepository itemTemplateRepository;
    private final AbilityTemplateRepository abilityTemplateRepository;
    private final HeroRepository heroRepository;
    private final TeamSlotRepository teamSlotRepository;
    private final PlayerRepository playerRepository;

    public EquipmentService(EquippedItemRepository equippedItemRepository,
                            EquippedAbilityRepository equippedAbilityRepository,
                            ItemTemplateRepository itemTemplateRepository,
                            AbilityTemplateRepository abilityTemplateRepository,
                            HeroRepository heroRepository,
                            TeamSlotRepository teamSlotRepository,
                            PlayerRepository playerRepository) {
        this.equippedItemRepository = equippedItemRepository;
        this.equippedAbilityRepository = equippedAbilityRepository;
        this.itemTemplateRepository = itemTemplateRepository;
        this.abilityTemplateRepository = abilityTemplateRepository;
        this.heroRepository = heroRepository;
        this.teamSlotRepository = teamSlotRepository;
        this.playerRepository = playerRepository;
    }

    public Map<String, Object> getHeroEquipment(Long playerId, Long heroId) {
        Hero hero = heroRepository.findById(heroId)
                .orElseThrow(() -> new RuntimeException("Hero not found"));
        if (!hero.getPlayerId().equals(playerId)) {
            throw new RuntimeException("Not your hero");
        }

        List<EquippedItem> items = equippedItemRepository.findByHeroId(heroId);
        List<EquippedAbility> abilities = equippedAbilityRepository.findByHeroId(heroId);

        List<Map<String, Object>> itemSlots = new ArrayList<>();
        for (int slot = 1; slot <= 3; slot++) {
            final int s = slot;
            Optional<EquippedItem> ei = items.stream().filter(i -> i.getSlotNumber() == s).findFirst();
            Map<String, Object> slotMap = new LinkedHashMap<>();
            slotMap.put("slotNumber", slot);
            if (ei.isPresent()) {
                ItemTemplate it = ei.get().getItemTemplate();
                slotMap.put("equippedItemId", ei.get().getId());
                slotMap.put("itemTemplateId", it.getId());
                slotMap.put("name", it.getName());
                Map<String, Double> bonuses = new LinkedHashMap<>();
                if (it.getBonusPa() != 0) bonuses.put("physicalAttack", it.getBonusPa());
                if (it.getBonusMp() != 0) bonuses.put("magicPower", it.getBonusMp());
                if (it.getBonusDex() != 0) bonuses.put("dexterity", it.getBonusDex());
                if (it.getBonusElem() != 0) bonuses.put("element", it.getBonusElem());
                if (it.getBonusMana() != 0) bonuses.put("mana", it.getBonusMana());
                if (it.getBonusStam() != 0) bonuses.put("stamina", it.getBonusStam());
                slotMap.put("bonuses", bonuses);
                slotMap.put("sellPrice", (int) (it.getCost() * 0.75));
            } else {
                slotMap.put("equippedItemId", null);
                slotMap.put("itemTemplateId", null);
                slotMap.put("name", null);
                slotMap.put("bonuses", null);
                slotMap.put("sellPrice", null);
            }
            itemSlots.add(slotMap);
        }

        List<Map<String, Object>> abilityList = new ArrayList<>();
        for (EquippedAbility ea : abilities) {
            AbilityTemplate at = ea.getAbilityTemplate();
            Map<String, Object> abilityMap = new LinkedHashMap<>();
            abilityMap.put("equippedAbilityId", ea.getId());
            abilityMap.put("abilityTemplateId", at.getId());
            abilityMap.put("name", at.getName());
            abilityMap.put("tier", at.getTier());
            Map<String, Double> bonuses = new LinkedHashMap<>();
            if (at.getBonusPa() != 0) bonuses.put("physicalAttack", at.getBonusPa());
            if (at.getBonusMp() != 0) bonuses.put("magicPower", at.getBonusMp());
            if (at.getBonusDex() != 0) bonuses.put("dexterity", at.getBonusDex());
            if (at.getBonusElem() != 0) bonuses.put("element", at.getBonusElem());
            if (at.getBonusMana() != 0) bonuses.put("mana", at.getBonusMana());
            if (at.getBonusStam() != 0) bonuses.put("stamina", at.getBonusStam());
            abilityMap.put("bonuses", bonuses);
            abilityList.add(abilityMap);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("heroId", heroId);
        result.put("heroName", hero.getTemplate().getDisplayName());
        result.put("items", itemSlots);
        result.put("abilities", abilityList);
        return result;
    }

    @Transactional
    public Map<String, Object> equipItem(Long playerId, Long heroId, Long itemTemplateId, Integer slotNumber) {
        Hero hero = heroRepository.findById(heroId)
                .orElseThrow(() -> new RuntimeException("Hero not found"));
        if (!hero.getPlayerId().equals(playerId)) {
            return Map.of("error", "NOT_YOUR_HERO", "message", "This hero doesn't belong to you.");
        }
        if (slotNumber < 1 || slotNumber > 3) {
            return Map.of("error", "INVALID_SLOT", "message", "Item slot must be 1-3.");
        }

        // Check slot not occupied
        if (equippedItemRepository.findByHeroIdAndSlotNumber(heroId, slotNumber).isPresent()) {
            return Map.of("error", "SLOT_OCCUPIED", "message", "Slot " + slotNumber + " already has an item. Unequip it first.");
        }

        // Check no duplicate item on this hero
        if (equippedItemRepository.findByHeroIdAndItemTemplateId(heroId, itemTemplateId).isPresent()) {
            ItemTemplate it = itemTemplateRepository.findById(itemTemplateId).orElseThrow();
            return Map.of("error", "DUPLICATE_ITEM_ON_HERO", "message", hero.getTemplate().getDisplayName() + " already has " + it.getName() + " equipped.");
        }

        // Check team-wide count < 3
        List<TeamSlot> teamSlots = teamSlotRepository.findByPlayerId(playerId);
        List<Long> teamHeroIds = teamSlots.stream()
                .filter(s -> s.getHeroId() != null)
                .map(TeamSlot::getHeroId)
                .collect(Collectors.toList());
        List<EquippedItem> teamItems = equippedItemRepository.findByHeroIdIn(teamHeroIds);
        long sameItemCount = teamItems.stream()
                .filter(i -> i.getItemTemplateId().equals(itemTemplateId))
                .count();
        if (sameItemCount >= 3) {
            ItemTemplate it = itemTemplateRepository.findById(itemTemplateId).orElseThrow();
            return Map.of("error", "TEAM_ITEM_LIMIT", "message", "Your team already has 3 " + it.getName() + " equipped (maximum).");
        }

        EquippedItem ei = EquippedItem.builder()
                .heroId(heroId)
                .itemTemplateId(itemTemplateId)
                .slotNumber(slotNumber)
                .build();
        equippedItemRepository.save(ei);

        ItemTemplate it = itemTemplateRepository.findById(itemTemplateId).orElseThrow();
        return Map.of("message", it.getName() + " equipped to slot " + slotNumber + ".");
    }

    @Transactional
    public Map<String, Object> unequipItem(Long playerId, Long heroId, Integer slotNumber) {
        Hero hero = heroRepository.findById(heroId)
                .orElseThrow(() -> new RuntimeException("Hero not found"));
        if (!hero.getPlayerId().equals(playerId)) {
            return Map.of("error", "NOT_YOUR_HERO", "message", "This hero doesn't belong to you.");
        }

        Optional<EquippedItem> opt = equippedItemRepository.findByHeroIdAndSlotNumber(heroId, slotNumber);
        if (opt.isEmpty()) {
            return Map.of("error", "NO_ITEM", "message", "No item in slot " + slotNumber + ".");
        }

        String itemName = opt.get().getItemTemplate().getName();
        equippedItemRepository.delete(opt.get());
        return Map.of("message", itemName + " unequipped from " + hero.getTemplate().getDisplayName() + ".");
    }

    @Transactional
    public Map<String, Object> sellItem(Long playerId, Long heroId, Integer slotNumber) {
        Hero hero = heroRepository.findById(heroId)
                .orElseThrow(() -> new RuntimeException("Hero not found"));
        if (!hero.getPlayerId().equals(playerId)) {
            return Map.of("error", "NOT_YOUR_HERO", "message", "This hero doesn't belong to you.");
        }

        Optional<EquippedItem> opt = equippedItemRepository.findByHeroIdAndSlotNumber(heroId, slotNumber);
        if (opt.isEmpty()) {
            return Map.of("error", "NO_ITEM", "message", "No item in slot " + slotNumber + " to sell.");
        }

        ItemTemplate it = opt.get().getItemTemplate();
        int sellPrice = (int) (it.getCost() * 0.75);

        equippedItemRepository.delete(opt.get());

        Player player = playerRepository.findById(playerId).orElseThrow();
        player.setGold(player.getGold() + sellPrice);
        playerRepository.save(player);

        return Map.of(
                "message", it.getName() + " sold for " + sellPrice + " gold.",
                "goldEarned", sellPrice,
                "goldTotal", player.getGold()
        );
    }

    @Transactional
    public Map<String, Object> equipAbility(Long playerId, Long heroId, Long abilityTemplateId) {
        Hero hero = heroRepository.findById(heroId)
                .orElseThrow(() -> new RuntimeException("Hero not found"));
        if (!hero.getPlayerId().equals(playerId)) {
            return Map.of("error", "NOT_YOUR_HERO", "message", "This hero doesn't belong to you.");
        }

        AbilityTemplate at = abilityTemplateRepository.findById(abilityTemplateId)
                .orElseThrow(() -> new RuntimeException("Ability not found"));

        if (!at.getHeroTemplateId().equals(hero.getTemplateId())) {
            return Map.of("error", "WRONG_HERO", "message", hero.getTemplate().getDisplayName() + " cannot learn " + at.getName() + ".");
        }

        if (equippedAbilityRepository.findByHeroIdAndAbilityTemplateId(heroId, abilityTemplateId).isPresent()) {
            return Map.of("error", "DUPLICATE_ABILITY", "message", hero.getTemplate().getDisplayName() + " already knows " + at.getName() + ".");
        }

        EquippedAbility ea = EquippedAbility.builder()
                .heroId(heroId)
                .abilityTemplateId(abilityTemplateId)
                .build();
        equippedAbilityRepository.save(ea);

        return Map.of("message", at.getName() + " learned by " + hero.getTemplate().getDisplayName() + ".");
    }

    @Transactional
    public Map<String, Object> unequipAbility(Long playerId, Long heroId, Long abilityTemplateId) {
        Hero hero = heroRepository.findById(heroId)
                .orElseThrow(() -> new RuntimeException("Hero not found"));
        if (!hero.getPlayerId().equals(playerId)) {
            return Map.of("error", "NOT_YOUR_HERO", "message", "This hero doesn't belong to you.");
        }

        Optional<EquippedAbility> opt = equippedAbilityRepository.findByHeroIdAndAbilityTemplateId(heroId, abilityTemplateId);
        if (opt.isEmpty()) {
            return Map.of("error", "ABILITY_NOT_EQUIPPED", "message", "This ability is not equipped.");
        }

        String name = opt.get().getAbilityTemplate().getName();
        equippedAbilityRepository.delete(opt.get());
        return Map.of("message", name + " unequipped from " + hero.getTemplate().getDisplayName() + ".");
    }
}
