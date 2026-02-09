package com.heromanager.service;

import com.heromanager.dto.ShopHeroResponse;
import com.heromanager.entity.*;
import com.heromanager.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class ShopService {

    private final PlayerRepository playerRepository;
    private final HeroRepository heroRepository;
    private final HeroTemplateRepository heroTemplateRepository;
    private final SummonRepository summonRepository;
    private final SummonTemplateRepository summonTemplateRepository;
    private final ItemTemplateRepository itemTemplateRepository;
    private final AbilityTemplateRepository abilityTemplateRepository;
    private final EquippedAbilityRepository equippedAbilityRepository;

    public ShopService(PlayerRepository playerRepository,
                       HeroRepository heroRepository,
                       HeroTemplateRepository heroTemplateRepository,
                       SummonRepository summonRepository,
                       SummonTemplateRepository summonTemplateRepository,
                       ItemTemplateRepository itemTemplateRepository,
                       AbilityTemplateRepository abilityTemplateRepository,
                       EquippedAbilityRepository equippedAbilityRepository) {
        this.playerRepository = playerRepository;
        this.heroRepository = heroRepository;
        this.heroTemplateRepository = heroTemplateRepository;
        this.summonRepository = summonRepository;
        this.summonTemplateRepository = summonTemplateRepository;
        this.itemTemplateRepository = itemTemplateRepository;
        this.abilityTemplateRepository = abilityTemplateRepository;
        this.equippedAbilityRepository = equippedAbilityRepository;
    }

    public Map<String, Object> listHeroes(Long playerId) {
        List<HeroTemplate> heroTemplates = heroTemplateRepository.findAll();
        List<Hero> ownedHeroes = heroRepository.findByPlayerId(playerId);
        Set<Long> ownedHeroTemplateIds = new HashSet<>();
        for (Hero h : ownedHeroes) {
            ownedHeroTemplateIds.add(h.getTemplateId());
        }

        List<ShopHeroResponse> heroResponses = new ArrayList<>();
        for (HeroTemplate ht : heroTemplates) {
            Map<String, Double> baseStats = new LinkedHashMap<>();
            baseStats.put("pa", ht.getBasePa());
            baseStats.put("mp", ht.getBaseMp());
            baseStats.put("dex", ht.getBaseDex());
            baseStats.put("elem", ht.getBaseElem());
            baseStats.put("mana", ht.getBaseMana());
            baseStats.put("stam", ht.getBaseStam());

            Map<String, Double> growthStats = new LinkedHashMap<>();
            growthStats.put("pa", ht.getGrowthPa());
            growthStats.put("mp", ht.getGrowthMp());
            growthStats.put("dex", ht.getGrowthDex());
            growthStats.put("elem", ht.getGrowthElem());
            growthStats.put("mana", ht.getGrowthMana());
            growthStats.put("stam", ht.getGrowthStam());

            heroResponses.add(ShopHeroResponse.builder()
                    .templateId(ht.getId())
                    .name(ht.getName())
                    .displayName(ht.getDisplayName())
                    .imagePath(ht.getImagePath())
                    .cost(ht.getCost())
                    .capacity(ht.getCapacity())
                    .baseStats(baseStats)
                    .growthStats(growthStats)
                    .owned(ownedHeroTemplateIds.contains(ht.getId()))
                    .build());
        }

        // Summon templates
        List<SummonTemplate> summonTemplates = summonTemplateRepository.findAll();
        List<Summon> ownedSummons = summonRepository.findByPlayerId(playerId);
        Set<Long> ownedSummonTemplateIds = new HashSet<>();
        for (Summon s : ownedSummons) {
            ownedSummonTemplateIds.add(s.getTemplateId());
        }

        List<Map<String, Object>> summonResponses = new ArrayList<>();
        for (SummonTemplate st : summonTemplates) {
            Map<String, Object> summonMap = new LinkedHashMap<>();
            summonMap.put("templateId", st.getId());
            summonMap.put("name", st.getName());
            summonMap.put("displayName", st.getDisplayName());
            summonMap.put("imagePath", st.getImagePath());
            summonMap.put("cost", st.getCost());
            summonMap.put("capacity", st.getCapacity());

            Map<String, Double> baseStats = new LinkedHashMap<>();
            baseStats.put("mana", st.getBaseMana());
            baseStats.put("mp", st.getBaseMp());
            summonMap.put("baseStats", baseStats);

            Map<String, Double> growthStats = new LinkedHashMap<>();
            growthStats.put("mana", st.getGrowthMana());
            growthStats.put("mp", st.getGrowthMp());
            summonMap.put("growthStats", growthStats);

            summonMap.put("owned", ownedSummonTemplateIds.contains(st.getId()));
            summonResponses.add(summonMap);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("heroes", heroResponses);
        result.put("summons", summonResponses);
        return result;
    }

    @Transactional
    public Map<String, Object> buyHero(Long playerId, Long templateId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        HeroTemplate template = heroTemplateRepository.findById(templateId)
                .orElseThrow(() -> new RuntimeException("Hero template not found"));

        if (heroRepository.existsByPlayerIdAndTemplateId(playerId, templateId)) {
            return Map.of("error", "ALREADY_OWNED", "message", "You already own " + template.getDisplayName() + ".");
        }

        if (player.getGold() < template.getCost()) {
            return Map.of("error", "INSUFFICIENT_GOLD", "message", "You need " + template.getCost() + " gold but only have " + player.getGold() + ".");
        }

        player.setGold(player.getGold() - template.getCost());
        playerRepository.save(player);

        Hero hero = Hero.builder()
                .playerId(playerId)
                .templateId(templateId)
                .level(1)
                .currentXp(0)
                .build();
        heroRepository.save(hero);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("heroId", hero.getId());
        result.put("name", template.getDisplayName());
        result.put("goldRemaining", player.getGold());
        return result;
    }

    @Transactional
    public Map<String, Object> buySummon(Long playerId, Long templateId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        SummonTemplate template = summonTemplateRepository.findById(templateId)
                .orElseThrow(() -> new RuntimeException("Summon template not found"));

        if (summonRepository.existsByPlayerIdAndTemplateId(playerId, templateId)) {
            return Map.of("error", "ALREADY_OWNED", "message", "You already own " + template.getDisplayName() + ".");
        }

        if (player.getGold() < template.getCost()) {
            return Map.of("error", "INSUFFICIENT_GOLD", "message", "You need " + template.getCost() + " gold but only have " + player.getGold() + ".");
        }

        player.setGold(player.getGold() - template.getCost());
        playerRepository.save(player);

        Summon summon = Summon.builder()
                .playerId(playerId)
                .templateId(templateId)
                .level(1)
                .currentXp(0)
                .build();
        summonRepository.save(summon);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("summonId", summon.getId());
        result.put("name", template.getDisplayName());
        result.put("goldRemaining", player.getGold());
        return result;
    }

    public List<Map<String, Object>> listItems() {
        List<ItemTemplate> templates = itemTemplateRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (ItemTemplate it : templates) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", it.getId());
            item.put("name", it.getName());
            item.put("cost", it.getCost());

            Map<String, Double> bonuses = new LinkedHashMap<>();
            bonuses.put("pa", it.getBonusPa());
            bonuses.put("mp", it.getBonusMp());
            bonuses.put("dex", it.getBonusDex());
            bonuses.put("elem", it.getBonusElem());
            bonuses.put("mana", it.getBonusMana());
            bonuses.put("stam", it.getBonusStam());
            item.put("bonuses", bonuses);

            result.add(item);
        }
        return result;
    }

    public List<Map<String, Object>> listAbilitiesForHero(Long playerId, Long heroId) {
        Hero hero = heroRepository.findById(heroId)
                .orElseThrow(() -> new RuntimeException("Hero not found"));
        if (!hero.getPlayerId().equals(playerId)) {
            throw new RuntimeException("Hero does not belong to player");
        }

        List<AbilityTemplate> templates = abilityTemplateRepository.findByHeroTemplateId(hero.getTemplateId());
        List<EquippedAbility> equipped = equippedAbilityRepository.findByHeroId(heroId);
        Set<Long> equippedIds = new HashSet<>();
        for (EquippedAbility ea : equipped) {
            equippedIds.add(ea.getAbilityTemplateId());
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (AbilityTemplate at : templates) {
            Map<String, Object> ability = new LinkedHashMap<>();
            ability.put("id", at.getId());
            ability.put("name", at.getName());
            ability.put("tier", at.getTier());
            ability.put("cost", at.getCost());
            ability.put("heroTemplateId", at.getHeroTemplateId());
            ability.put("owned", equippedIds.contains(at.getId()));

            Map<String, Double> bonuses = new LinkedHashMap<>();
            bonuses.put("pa", at.getBonusPa());
            bonuses.put("mp", at.getBonusMp());
            bonuses.put("dex", at.getBonusDex());
            bonuses.put("elem", at.getBonusElem());
            bonuses.put("mana", at.getBonusMana());
            bonuses.put("stam", at.getBonusStam());
            ability.put("bonuses", bonuses);

            result.add(ability);
        }
        return result;
    }

    @Transactional
    public Map<String, Object> buyItem(Long playerId, Long itemTemplateId, Long heroId, Integer slotNumber) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        ItemTemplate template = itemTemplateRepository.findById(itemTemplateId)
                .orElseThrow(() -> new RuntimeException("Item template not found"));

        if (player.getGold() < template.getCost()) {
            return Map.of("error", "INSUFFICIENT_GOLD", "message", "You need " + template.getCost() + " gold but only have " + player.getGold() + ".");
        }

        player.setGold(player.getGold() - template.getCost());
        playerRepository.save(player);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", template.getName() + " purchased.");
        result.put("goldRemaining", player.getGold());
        return result;
    }

    @Transactional
    public Map<String, Object> buyAbility(Long playerId, Long abilityTemplateId, Long heroId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        Hero hero = heroRepository.findById(heroId)
                .orElseThrow(() -> new RuntimeException("Hero not found"));
        if (!hero.getPlayerId().equals(playerId)) {
            throw new RuntimeException("Hero does not belong to player");
        }

        AbilityTemplate template = abilityTemplateRepository.findById(abilityTemplateId)
                .orElseThrow(() -> new RuntimeException("Ability template not found"));

        if (!template.getHeroTemplateId().equals(hero.getTemplateId())) {
            return Map.of("error", "WRONG_HERO", "message", hero.getTemplate().getDisplayName() + " cannot learn " + template.getName() + ".");
        }

        if (equippedAbilityRepository.findByHeroIdAndAbilityTemplateId(heroId, abilityTemplateId).isPresent()) {
            return Map.of("error", "DUPLICATE_ABILITY", "message", hero.getTemplate().getDisplayName() + " already knows " + template.getName() + ".");
        }

        if (player.getGold() < template.getCost()) {
            return Map.of("error", "INSUFFICIENT_GOLD", "message", "You need " + template.getCost() + " gold but only have " + player.getGold() + ".");
        }

        player.setGold(player.getGold() - template.getCost());
        playerRepository.save(player);

        // Auto-equip the ability
        EquippedAbility ea = EquippedAbility.builder()
                .heroId(heroId)
                .abilityTemplateId(abilityTemplateId)
                .build();
        equippedAbilityRepository.save(ea);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("abilityTemplateId", abilityTemplateId);
        result.put("name", template.getName());
        result.put("goldRemaining", player.getGold());
        return result;
    }
}
