package com.heromanager.service;

import com.heromanager.dto.ShopHeroResponse;
import com.heromanager.entity.*;
import com.heromanager.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class ShopService {

    private final HeroTemplateRepository heroTemplateRepository;
    private final SummonTemplateRepository summonTemplateRepository;
    private final HeroRepository heroRepository;
    private final SummonRepository summonRepository;
    private final PlayerRepository playerRepository;
    private final ItemTemplateRepository itemTemplateRepository;
    private final AbilityTemplateRepository abilityTemplateRepository;
    private final EquippedItemRepository equippedItemRepository;
    private final EquippedAbilityRepository equippedAbilityRepository;

    public ShopService(HeroTemplateRepository heroTemplateRepository,
                       SummonTemplateRepository summonTemplateRepository,
                       HeroRepository heroRepository,
                       SummonRepository summonRepository,
                       PlayerRepository playerRepository,
                       ItemTemplateRepository itemTemplateRepository,
                       AbilityTemplateRepository abilityTemplateRepository,
                       EquippedItemRepository equippedItemRepository,
                       EquippedAbilityRepository equippedAbilityRepository) {
        this.heroTemplateRepository = heroTemplateRepository;
        this.summonTemplateRepository = summonTemplateRepository;
        this.heroRepository = heroRepository;
        this.summonRepository = summonRepository;
        this.playerRepository = playerRepository;
        this.itemTemplateRepository = itemTemplateRepository;
        this.abilityTemplateRepository = abilityTemplateRepository;
        this.equippedItemRepository = equippedItemRepository;
        this.equippedAbilityRepository = equippedAbilityRepository;
    }

    public Map<String, Object> listHeroes(Long playerId) {
        List<HeroTemplate> templates = heroTemplateRepository.findAll();
        List<SummonTemplate> summonTemplates = summonTemplateRepository.findAll();

        List<ShopHeroResponse> heroes = new ArrayList<>();
        for (HeroTemplate t : templates) {
            if (t.isStarter()) continue; // Don't show starter in shop

            boolean owned = heroRepository.existsByPlayerIdAndTemplateId(playerId, t.getId());
            heroes.add(ShopHeroResponse.builder()
                    .templateId(t.getId())
                    .name(t.getName())
                    .displayName(t.getDisplayName())
                    .imagePath(t.getImagePath())
                    .cost(t.getCost())
                    .capacity(t.getCapacity())
                    .baseStats(Map.of(
                            "physicalAttack", t.getBasePa(),
                            "magicPower", t.getBaseMp(),
                            "dexterity", t.getBaseDex(),
                            "element", t.getBaseElem(),
                            "mana", t.getBaseMana(),
                            "stamina", t.getBaseStam()))
                    .growthStats(Map.of(
                            "physicalAttack", t.getGrowthPa(),
                            "magicPower", t.getGrowthMp(),
                            "dexterity", t.getGrowthDex(),
                            "element", t.getGrowthElem(),
                            "mana", t.getGrowthMana(),
                            "stamina", t.getGrowthStam()))
                    .owned(owned)
                    .tier(t.getTier() != null ? t.getTier().name() : null)
                    .element(t.getElement() != null ? t.getElement().name() : null)
                    .build());
        }

        List<Map<String, Object>> summons = new ArrayList<>();
        for (SummonTemplate st : summonTemplates) {
            boolean owned = summonRepository.existsByPlayerIdAndTemplateId(playerId, st.getId());
            summons.add(Map.of(
                    "templateId", st.getId(),
                    "name", st.getDisplayName(),
                    "imagePath", st.getImagePath(),
                    "cost", st.getCost(),
                    "capacity", st.getCapacity(),
                    "baseStats", Map.of("mana", st.getBaseMana(), "magicPower", st.getBaseMp()),
                    "growthStats", Map.of("mana", st.getGrowthMana(), "magicPower", st.getGrowthMp()),
                    "owned", owned
            ));
        }

        return Map.of("heroes", heroes, "summons", summons);
    }

    @Transactional
    public Map<String, Object> buyHero(Long playerId, Long templateId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new ShopException("PLAYER_NOT_FOUND", "Player not found."));

        HeroTemplate template = heroTemplateRepository.findById(templateId)
                .orElseThrow(() -> new ShopException("TEMPLATE_NOT_FOUND", "Hero template not found."));

        if (heroRepository.existsByPlayerIdAndTemplateId(playerId, templateId)) {
            throw new ShopException("ALREADY_OWNED", "You already own " + template.getDisplayName() + ".");
        }

        if (player.getGold() < template.getCost()) {
            throw new ShopException("INSUFFICIENT_GOLD",
                    "You need " + template.getCost() + " gold but only have " + player.getGold() + ".");
        }

        player.setGold(player.getGold() - template.getCost());
        if (template.getImagePath() != null) {
            player.getUnlockedAvatars().add(template.getImagePath());
        }
        playerRepository.save(player);

        Hero hero = new Hero();
        hero.setPlayerId(playerId);
        hero.setTemplateId(templateId);
        hero.setLevel(1);
        hero.setCurrentXp(0);
        heroRepository.save(hero);

        return Map.of(
                "message", template.getDisplayName() + " purchased successfully!",
                "heroId", hero.getId(),
                "goldRemaining", player.getGold()
        );
    }

    @Transactional
    public Map<String, Object> buySummon(Long playerId, Long templateId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new ShopException("PLAYER_NOT_FOUND", "Player not found."));

        SummonTemplate template = summonTemplateRepository.findById(templateId)
                .orElseThrow(() -> new ShopException("TEMPLATE_NOT_FOUND", "Summon template not found."));

        if (summonRepository.existsByPlayerIdAndTemplateId(playerId, templateId)) {
            throw new ShopException("ALREADY_OWNED", "You already own " + template.getDisplayName() + ".");
        }

        if (player.getGold() < template.getCost()) {
            throw new ShopException("INSUFFICIENT_GOLD",
                    "You need " + template.getCost() + " gold but only have " + player.getGold() + ".");
        }

        player.setGold(player.getGold() - template.getCost());
        playerRepository.save(player);

        Summon summon = new Summon();
        summon.setPlayerId(playerId);
        summon.setTemplateId(templateId);
        summon.setLevel(1);
        summon.setCurrentXp(0);
        summonRepository.save(summon);

        return Map.of(
                "message", template.getDisplayName() + " purchased!",
                "summonId", summon.getId(),
                "goldRemaining", player.getGold()
        );
    }

    public Map<String, Object> listItems() {
        List<ItemTemplate> templates = itemTemplateRepository.findAll();
        List<Map<String, Object>> items = new ArrayList<>();
        for (ItemTemplate t : templates) {
            Map<String, Object> bonuses = new LinkedHashMap<>();
            if (t.getBonusPa() != 0) bonuses.put("physicalAttack", t.getBonusPa());
            if (t.getBonusMp() != 0) bonuses.put("magicPower", t.getBonusMp());
            if (t.getBonusDex() != 0) bonuses.put("dexterity", t.getBonusDex());
            if (t.getBonusElem() != 0) bonuses.put("element", t.getBonusElem());
            if (t.getBonusMana() != 0) bonuses.put("mana", t.getBonusMana());
            if (t.getBonusStam() != 0) bonuses.put("stamina", t.getBonusStam());

            items.add(Map.of(
                    "templateId", t.getId(),
                    "name", t.getName(),
                    "cost", t.getCost(),
                    "bonuses", bonuses
            ));
        }
        return Map.of("items", items);
    }

    @Transactional
    public Map<String, Object> buyItem(Long playerId, Long itemTemplateId, Long heroId, int slotNumber) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new ShopException("PLAYER_NOT_FOUND", "Player not found."));
        ItemTemplate template = itemTemplateRepository.findById(itemTemplateId)
                .orElseThrow(() -> new ShopException("ITEM_NOT_FOUND", "Item not found."));
        Hero hero = heroRepository.findById(heroId)
                .orElseThrow(() -> new ShopException("HERO_NOT_FOUND", "Hero not found."));
        if (!hero.getPlayerId().equals(playerId)) {
            throw new ShopException("HERO_NOT_FOUND", "Hero not found.");
        }

        if (player.getGold() < template.getCost()) {
            throw new ShopException("INSUFFICIENT_GOLD",
                    "You need " + template.getCost() + " gold but only have " + player.getGold() + ".");
        }
        if (slotNumber < 1 || slotNumber > 3) {
            throw new ShopException("INVALID_SLOT", "Item slot must be 1-3.");
        }
        if (equippedItemRepository.findByHeroIdAndSlotNumber(heroId, slotNumber).isPresent()) {
            throw new ShopException("SLOT_OCCUPIED",
                    "Slot " + slotNumber + " already has an item. Unequip it first.");
        }
        if (equippedItemRepository.findByHeroIdAndItemTemplateId(heroId, itemTemplateId).isPresent()) {
            throw new ShopException("DUPLICATE_ITEM",
                    hero.getTemplate().getDisplayName() + " already has " + template.getName() + " equipped.");
        }
        long teamCount = equippedItemRepository.countByPlayerAndItemTemplate(playerId, itemTemplateId);
        if (teamCount >= 3) {
            throw new ShopException("TEAM_ITEM_LIMIT",
                    "Your team already has 3 " + template.getName() + " equipped (maximum).");
        }

        player.setGold(player.getGold() - template.getCost());
        playerRepository.save(player);

        EquippedItem ei = new EquippedItem();
        ei.setHeroId(heroId);
        ei.setItemTemplateId(itemTemplateId);
        ei.setSlotNumber(slotNumber);
        equippedItemRepository.save(ei);

        return Map.of(
                "message", template.getName() + " equipped to " + hero.getTemplate().getDisplayName() + ".",
                "goldRemaining", player.getGold()
        );
    }

    public Map<String, Object> listAbilities(Long playerId, Long heroId) {
        Hero hero = heroRepository.findById(heroId)
                .orElseThrow(() -> new ShopException("HERO_NOT_FOUND", "Hero not found."));
        if (!hero.getPlayerId().equals(playerId)) {
            throw new ShopException("HERO_NOT_FOUND", "Hero not found.");
        }

        List<AbilityTemplate> templates = abilityTemplateRepository.findByHeroTemplateId(hero.getTemplateId());
        List<EquippedAbility> equipped = equippedAbilityRepository.findByHeroId(heroId);
        Set<Long> ownedIds = new HashSet<>();
        for (EquippedAbility ea : equipped) {
            ownedIds.add(ea.getAbilityTemplateId());
        }

        List<Map<String, Object>> abilities = new ArrayList<>();
        for (AbilityTemplate t : templates) {
            Map<String, Object> bonuses = new LinkedHashMap<>();
            if (t.getBonusPa() != 0) bonuses.put("physicalAttack", t.getBonusPa());
            if (t.getBonusMp() != 0) bonuses.put("magicPower", t.getBonusMp());
            if (t.getBonusDex() != 0) bonuses.put("dexterity", t.getBonusDex());
            if (t.getBonusElem() != 0) bonuses.put("element", t.getBonusElem());
            if (t.getBonusMana() != 0) bonuses.put("mana", t.getBonusMana());
            if (t.getBonusStam() != 0) bonuses.put("stamina", t.getBonusStam());

            abilities.add(Map.of(
                    "templateId", t.getId(),
                    "name", t.getName(),
                    "cost", t.getCost(),
                    "tier", t.getTier(),
                    "bonuses", bonuses,
                    "owned", ownedIds.contains(t.getId())
            ));
        }

        return Map.of(
                "heroName", hero.getTemplate().getDisplayName(),
                "abilities", abilities
        );
    }

    @Transactional
    public Map<String, Object> buyAbility(Long playerId, Long abilityTemplateId, Long heroId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new ShopException("PLAYER_NOT_FOUND", "Player not found."));
        Hero hero = heroRepository.findById(heroId)
                .orElseThrow(() -> new ShopException("HERO_NOT_FOUND", "Hero not found."));
        if (!hero.getPlayerId().equals(playerId)) {
            throw new ShopException("HERO_NOT_FOUND", "Hero not found.");
        }

        AbilityTemplate template = abilityTemplateRepository.findById(abilityTemplateId)
                .orElseThrow(() -> new ShopException("ABILITY_NOT_FOUND", "Ability not found."));

        if (!template.getHeroTemplateId().equals(hero.getTemplateId())) {
            throw new ShopException("WRONG_HERO",
                    template.getName() + " is not available for " + hero.getTemplate().getDisplayName() + ".");
        }
        if (equippedAbilityRepository.findByHeroIdAndAbilityTemplateId(heroId, abilityTemplateId).isPresent()) {
            throw new ShopException("DUPLICATE_ABILITY",
                    hero.getTemplate().getDisplayName() + " already knows " + template.getName() + ".");
        }
        if (player.getGold() < template.getCost()) {
            throw new ShopException("INSUFFICIENT_GOLD",
                    "You need " + template.getCost() + " gold but only have " + player.getGold() + ".");
        }

        player.setGold(player.getGold() - template.getCost());
        playerRepository.save(player);

        EquippedAbility ea = new EquippedAbility();
        ea.setHeroId(heroId);
        ea.setAbilityTemplateId(abilityTemplateId);
        equippedAbilityRepository.save(ea);

        return Map.of(
                "message", template.getName() + " learned by " + hero.getTemplate().getDisplayName() + ".",
                "goldRemaining", player.getGold()
        );
    }

    public static class ShopException extends RuntimeException {
        private final String errorCode;

        public ShopException(String errorCode, String message) {
            super(message);
            this.errorCode = errorCode;
        }

        public String getErrorCode() {
            return errorCode;
        }
    }
}
