package com.heromanager.service;

import com.heromanager.dto.HeroResponse;
import com.heromanager.dto.PlayerResponse;
import com.heromanager.dto.SummonResponse;
import com.heromanager.entity.*;
import com.heromanager.repository.*;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final HeroRepository heroRepository;
    private final SummonRepository summonRepository;
    private final TeamSlotRepository teamSlotRepository;
    private final EquippedItemRepository equippedItemRepository;
    private final EquippedAbilityRepository equippedAbilityRepository;
    private final EnergyService energyService;

    public PlayerService(PlayerRepository playerRepository,
                         HeroRepository heroRepository,
                         SummonRepository summonRepository,
                         TeamSlotRepository teamSlotRepository,
                         EquippedItemRepository equippedItemRepository,
                         EquippedAbilityRepository equippedAbilityRepository,
                         EnergyService energyService) {
        this.playerRepository = playerRepository;
        this.heroRepository = heroRepository;
        this.summonRepository = summonRepository;
        this.teamSlotRepository = teamSlotRepository;
        this.equippedItemRepository = equippedItemRepository;
        this.equippedAbilityRepository = equippedAbilityRepository;
        this.energyService = energyService;
    }

    public PlayerResponse getPlayerInfo(Long playerId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        energyService.recalculateEnergy(player);

        boolean online = energyService.isOnline(player);
        Long onlineMinutesRemaining = null;
        if (online && player.getOnlineUntil() != null) {
            onlineMinutesRemaining = Duration.between(LocalDateTime.now(), player.getOnlineUntil()).toMinutes();
            if (onlineMinutesRemaining < 0) onlineMinutesRemaining = 0L;
        }

        return PlayerResponse.builder()
                .id(player.getId())
                .username(player.getUsername())
                .gold(player.getGold())
                .diamonds(player.getDiamonds())
                .arenaEnergy(energyService.calculateCurrentEnergy(player, "arena"))
                .arenaEnergyMax(120)
                .worldEnergy(energyService.calculateCurrentEnergy(player, "world"))
                .worldEnergyMax(120)
                .nextEnergyTickSeconds(energyService.getNextTickSeconds(player))
                .isOnline(online)
                .onlineMinutesRemaining(onlineMinutesRemaining)
                .build();
    }

    public List<HeroResponse> getHeroes(Long playerId) {
        List<Hero> heroes = heroRepository.findByPlayerId(playerId);
        List<TeamSlot> teamSlots = teamSlotRepository.findByPlayerId(playerId);

        // Build a map of heroId -> slotNumber for equipped heroes
        Map<Long, Integer> heroSlotMap = new HashMap<>();
        for (TeamSlot slot : teamSlots) {
            if (slot.getHeroId() != null) {
                heroSlotMap.put(slot.getHeroId(), slot.getSlotNumber());
            }
        }

        // Find equipped summon to get MP bonus
        Summon equippedSummon = null;
        for (TeamSlot slot : teamSlots) {
            if (slot.getSlotNumber() == 7 && slot.getSummonId() != null) {
                equippedSummon = summonRepository.findById(slot.getSummonId()).orElse(null);
                break;
            }
        }

        List<HeroResponse> responses = new ArrayList<>();
        for (Hero hero : heroes) {
            HeroTemplate t = hero.getTemplate();
            int level = hero.getLevel();

            // Compute base stats: base + growth * (level - 1)
            Map<String, Double> stats = new LinkedHashMap<>();
            stats.put("pa", t.getBasePa() + t.getGrowthPa() * (level - 1));
            stats.put("mp", t.getBaseMp() + t.getGrowthMp() * (level - 1));
            stats.put("dex", t.getBaseDex() + t.getGrowthDex() * (level - 1));
            stats.put("elem", t.getBaseElem() + t.getGrowthElem() * (level - 1));
            stats.put("mana", t.getBaseMana() + t.getGrowthMana() * (level - 1));
            stats.put("stam", t.getBaseStam() + t.getGrowthStam() * (level - 1));

            // Bonus stats from equipped items
            Map<String, Double> bonusStats = new LinkedHashMap<>();
            bonusStats.put("pa", 0.0);
            bonusStats.put("mp", 0.0);
            bonusStats.put("dex", 0.0);
            bonusStats.put("elem", 0.0);
            bonusStats.put("mana", 0.0);
            bonusStats.put("stam", 0.0);

            List<EquippedItem> items = equippedItemRepository.findByHeroId(hero.getId());
            List<Map<String, Object>> equippedItemsList = new ArrayList<>();
            for (EquippedItem ei : items) {
                ItemTemplate it = ei.getItemTemplate();
                bonusStats.merge("pa", it.getBonusPa(), Double::sum);
                bonusStats.merge("mp", it.getBonusMp(), Double::sum);
                bonusStats.merge("dex", it.getBonusDex(), Double::sum);
                bonusStats.merge("elem", it.getBonusElem(), Double::sum);
                bonusStats.merge("mana", it.getBonusMana(), Double::sum);
                bonusStats.merge("stam", it.getBonusStam(), Double::sum);

                Map<String, Object> itemMap = new LinkedHashMap<>();
                itemMap.put("slotNumber", ei.getSlotNumber());
                itemMap.put("itemTemplateId", it.getId());
                itemMap.put("name", it.getName());
                itemMap.put("cost", it.getCost());
                Map<String, Double> itemBonuses = new LinkedHashMap<>();
                itemBonuses.put("pa", it.getBonusPa());
                itemBonuses.put("mp", it.getBonusMp());
                itemBonuses.put("dex", it.getBonusDex());
                itemBonuses.put("elem", it.getBonusElem());
                itemBonuses.put("mana", it.getBonusMana());
                itemBonuses.put("stam", it.getBonusStam());
                itemMap.put("bonuses", itemBonuses);
                equippedItemsList.add(itemMap);
            }

            // Bonus stats from equipped abilities
            List<EquippedAbility> abilities = equippedAbilityRepository.findByHeroId(hero.getId());
            List<Map<String, Object>> equippedAbilitiesList = new ArrayList<>();
            for (EquippedAbility ea : abilities) {
                AbilityTemplate at = ea.getAbilityTemplate();
                bonusStats.merge("pa", at.getBonusPa(), Double::sum);
                bonusStats.merge("mp", at.getBonusMp(), Double::sum);
                bonusStats.merge("dex", at.getBonusDex(), Double::sum);
                bonusStats.merge("elem", at.getBonusElem(), Double::sum);
                bonusStats.merge("mana", at.getBonusMana(), Double::sum);
                bonusStats.merge("stam", at.getBonusStam(), Double::sum);

                Map<String, Object> abilityMap = new LinkedHashMap<>();
                abilityMap.put("abilityTemplateId", at.getId());
                abilityMap.put("name", at.getName());
                abilityMap.put("tier", at.getTier());
                abilityMap.put("cost", at.getCost());
                Map<String, Double> abilityBonuses = new LinkedHashMap<>();
                abilityBonuses.put("pa", at.getBonusPa());
                abilityBonuses.put("mp", at.getBonusMp());
                abilityBonuses.put("dex", at.getBonusDex());
                abilityBonuses.put("elem", at.getBonusElem());
                abilityBonuses.put("mana", at.getBonusMana());
                abilityBonuses.put("stam", at.getBonusStam());
                abilityMap.put("bonuses", abilityBonuses);
                equippedAbilitiesList.add(abilityMap);
            }

            // Add summon MP bonus if hero is equipped and summon is equipped
            if (heroSlotMap.containsKey(hero.getId()) && equippedSummon != null) {
                SummonTemplate st = equippedSummon.getTemplate();
                double summonMp = st.getBaseMp() + st.getGrowthMp() * (equippedSummon.getLevel() - 1);
                bonusStats.merge("mp", summonMp, Double::sum);
            }

            // XP to next level: level^2 * 10
            int xpToNextLevel = (int) Math.pow(level, 2) * 10;

            boolean isEquipped = heroSlotMap.containsKey(hero.getId());
            Integer teamSlot = heroSlotMap.get(hero.getId());

            responses.add(HeroResponse.builder()
                    .id(hero.getId())
                    .templateId(hero.getTemplateId())
                    .name(t.getDisplayName())
                    .imagePath(t.getImagePath())
                    .level(level)
                    .currentXp(hero.getCurrentXp())
                    .xpToNextLevel(xpToNextLevel)
                    .capacity(t.getCapacity())
                    .isEquipped(isEquipped)
                    .teamSlot(teamSlot)
                    .stats(stats)
                    .bonusStats(bonusStats)
                    .equippedItems(equippedItemsList)
                    .equippedAbilities(equippedAbilitiesList)
                    .build());
        }

        return responses;
    }

    public List<SummonResponse> getSummons(Long playerId) {
        List<Summon> summons = summonRepository.findByPlayerId(playerId);
        List<TeamSlot> teamSlots = teamSlotRepository.findByPlayerId(playerId);

        // Check if a summon is equipped in slot 7
        Long equippedSummonId = null;
        for (TeamSlot slot : teamSlots) {
            if (slot.getSlotNumber() == 7 && slot.getSummonId() != null) {
                equippedSummonId = slot.getSummonId();
                break;
            }
        }

        List<SummonResponse> responses = new ArrayList<>();
        for (Summon summon : summons) {
            SummonTemplate st = summon.getTemplate();
            int level = summon.getLevel();

            Map<String, Double> stats = new LinkedHashMap<>();
            stats.put("mana", st.getBaseMana() + st.getGrowthMana() * (level - 1));
            stats.put("mp", st.getBaseMp() + st.getGrowthMp() * (level - 1));

            int xpToNextLevel = (int) Math.pow(level, 2) * 10;

            responses.add(SummonResponse.builder()
                    .id(summon.getId())
                    .templateId(summon.getTemplateId())
                    .name(st.getName())
                    .displayName(st.getDisplayName())
                    .imagePath(st.getImagePath())
                    .level(level)
                    .currentXp(summon.getCurrentXp())
                    .xpToNextLevel(xpToNextLevel)
                    .capacity(st.getCapacity())
                    .isEquipped(summon.getId().equals(equippedSummonId))
                    .stats(stats)
                    .build());
        }

        return responses;
    }
}
