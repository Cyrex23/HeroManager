package com.heromanager.service;

import com.heromanager.dto.HeroResponse;
import com.heromanager.dto.PlayerResponse;
import com.heromanager.dto.SummonResponse;
import com.heromanager.entity.*;
import com.heromanager.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final HeroRepository heroRepository;
    private final SummonRepository summonRepository;
    private final TeamSlotRepository teamSlotRepository;
    private final EnergyService energyService;
    private final EquippedItemRepository equippedItemRepository;
    private final EquippedAbilityRepository equippedAbilityRepository;

    public PlayerService(PlayerRepository playerRepository,
                         HeroRepository heroRepository,
                         SummonRepository summonRepository,
                         TeamSlotRepository teamSlotRepository,
                         EnergyService energyService,
                         EquippedItemRepository equippedItemRepository,
                         EquippedAbilityRepository equippedAbilityRepository) {
        this.playerRepository = playerRepository;
        this.heroRepository = heroRepository;
        this.summonRepository = summonRepository;
        this.teamSlotRepository = teamSlotRepository;
        this.energyService = energyService;
        this.equippedItemRepository = equippedItemRepository;
        this.equippedAbilityRepository = equippedAbilityRepository;
    }

    public PlayerResponse getPlayerInfo(Long playerId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        energyService.refreshEnergy(player);

        boolean isOnline = energyService.isOnline(player);
        int onlineMinutes = 0;
        if (isOnline && player.getOnlineUntil() != null) {
            onlineMinutes = (int) Duration.between(LocalDateTime.now(), player.getOnlineUntil()).toMinutes();
        }

        return PlayerResponse.builder()
                .id(player.getId())
                .username(player.getUsername())
                .gold(player.getGold())
                .diamonds(player.getDiamonds())
                .arenaEnergy(player.getArenaEnergy())
                .arenaEnergyMax(120)
                .worldEnergy(player.getWorldEnergy())
                .worldEnergyMax(120)
                .nextEnergyTickSeconds(energyService.getNextTickSeconds(player))
                .isOnline(isOnline)
                .onlineMinutesRemaining(onlineMinutes)
                .profileImagePath(player.getProfileImagePath())
                .teamName(player.getTeamName() != null ? player.getTeamName() : player.getUsername())
                .build();
    }

    @Transactional(readOnly = true)
    public List<HeroResponse> getHeroes(Long playerId) {
        List<Hero> heroes = heroRepository.findByPlayerId(playerId);
        List<TeamSlot> teamSlots = teamSlotRepository.findByPlayerId(playerId);

        // Build slot lookup: heroId -> slotNumber
        Map<Long, Integer> heroSlotMap = new HashMap<>();
        for (TeamSlot slot : teamSlots) {
            if (slot.getHeroId() != null) {
                heroSlotMap.put(slot.getHeroId(), slot.getSlotNumber());
            }
        }

        List<HeroResponse> result = new ArrayList<>();
        for (Hero hero : heroes) {
            HeroTemplate t = hero.getTemplate();
            if (t == null) continue;
            int level = hero.getLevel();

            Map<String, Double> stats = buildHeroStats(t, level);
            Map<String, Double> baseStats = Map.of(
                    "physicalAttack", t.getBasePa(), "magicPower", t.getBaseMp(),
                    "dexterity", t.getBaseDex(), "element", t.getBaseElem(),
                    "mana", t.getBaseMana(), "stamina", t.getBaseStam()
            );
            Map<String, Double> growthStats = Map.of(
                    "physicalAttack", t.getGrowthPa(), "magicPower", t.getGrowthMp(),
                    "dexterity", t.getGrowthDex(), "element", t.getGrowthElem(),
                    "mana", t.getGrowthMana(), "stamina", t.getGrowthStam()
            );
            Map<String, Double> bonusStats = buildEquipmentBonuses(hero.getId());
            Map<String, Double> totalStats = new HashMap<>(stats);
            bonusStats.forEach((k, v) -> totalStats.merge(k, v, Double::sum));

            Integer slotNum = heroSlotMap.get(hero.getId());

            result.add(HeroResponse.builder()
                    .id(hero.getId())
                    .templateId(hero.getTemplateId())
                    .name(t.getDisplayName())
                    .imagePath(t.getImagePath())
                    .level(level)
                    .currentXp(hero.getCurrentXp())
                    .xpToNextLevel(level * level * 10)
                    .capacity(t.getCapacity())
                    .isEquipped(slotNum != null)
                    .teamSlot(slotNum)
                    .stats(totalStats)
                    .baseStats(baseStats)
                    .growthStats(growthStats)
                    .bonusStats(bonusStats)
                    .equippedItems(Collections.emptyList())
                    .equippedAbilities(Collections.emptyList())
                    .tier(t.getTier() != null ? t.getTier().name() : null)
                    .element(t.getElement() != null ? t.getElement().name() : null)
                    .clashesWon(hero.getClashesWon())
                    .clashesLost(hero.getClashesLost())
                    .currentWinStreak(hero.getCurrentWinStreak())
                    .currentLossStreak(hero.getCurrentLossStreak())
                    .maxDamageDealt(hero.getMaxDamageDealt())
                    .maxDamageReceived(hero.getMaxDamageReceived())
                    .build());
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<SummonResponse> getSummons(Long playerId) {
        List<Summon> summons = summonRepository.findByPlayerId(playerId);
        List<TeamSlot> teamSlots = teamSlotRepository.findByPlayerId(playerId);

        Set<Long> equippedSummonIds = new HashSet<>();
        for (TeamSlot slot : teamSlots) {
            if (slot.getSummonId() != null) {
                equippedSummonIds.add(slot.getSummonId());
            }
        }

        List<SummonResponse> result = new ArrayList<>();
        for (Summon summon : summons) {
            SummonTemplate t = summon.getTemplate();
            if (t == null) continue;
            int level = summon.getLevel();
            double mp = t.getBaseMp() + t.getGrowthMp() * (level - 1);
            double mana = t.getBaseMana() + t.getGrowthMana() * (level - 1);

            result.add(SummonResponse.builder()
                    .id(summon.getId())
                    .templateId(summon.getTemplateId())
                    .name(t.getDisplayName())
                    .imagePath(t.getImagePath())
                    .level(level)
                    .currentXp(summon.getCurrentXp())
                    .xpToNextLevel(level * level * 10)
                    .capacity(t.getCapacity())
                    .isEquipped(equippedSummonIds.contains(summon.getId()))
                    .stats(Map.of("mana", mana, "magicPower", mp))
                    .teamBonus("+" + (int) mp + " Magic Power to all team heroes")
                    .build());
        }
        return result;
    }

    private Map<String, Double> buildEquipmentBonuses(Long heroId) {
        Map<String, Double> bonuses = new HashMap<>();
        for (EquippedItem ei : equippedItemRepository.findByHeroIdAndSlotNumberIsNotNull(heroId)) {
            ItemTemplate t = ei.getItemTemplate();
            if (t == null) continue;
            bonuses.merge("physicalAttack", t.getBonusPa(), Double::sum);
            bonuses.merge("magicPower", t.getBonusMp(), Double::sum);
            bonuses.merge("dexterity", t.getBonusDex(), Double::sum);
            bonuses.merge("element", t.getBonusElem(), Double::sum);
            bonuses.merge("mana", t.getBonusMana(), Double::sum);
            bonuses.merge("stamina", t.getBonusStam(), Double::sum);
        }
        for (EquippedAbility ea : equippedAbilityRepository.findByHeroIdAndSlotNumberIsNotNull(heroId)) {
            AbilityTemplate at = ea.getAbilityTemplate();
            if (at == null) continue;
            bonuses.merge("physicalAttack", at.getBonusPa(), Double::sum);
            bonuses.merge("magicPower", at.getBonusMp(), Double::sum);
            bonuses.merge("dexterity", at.getBonusDex(), Double::sum);
            bonuses.merge("element", at.getBonusElem(), Double::sum);
            bonuses.merge("mana", at.getBonusMana(), Double::sum);
            bonuses.merge("stamina", at.getBonusStam(), Double::sum);
        }
        return bonuses;
    }

    @Transactional
    public Map<String, Object> sellHero(Long playerId, Long heroId) {
        Hero hero = heroRepository.findById(heroId)
                .orElseThrow(() -> new HeroSellException("HERO_NOT_FOUND", "Hero not found."));
        if (!hero.getPlayerId().equals(playerId)) {
            throw new HeroSellException("HERO_NOT_FOUND", "Hero not found.");
        }
        HeroTemplate template = hero.getTemplate();
        if (template == null) {
            throw new HeroSellException("HERO_NOT_FOUND", "Hero not found.");
        }
        if (template.isStarter()) {
            throw new HeroSellException("CANNOT_SELL_STARTER", "The starter hero cannot be sold.");
        }

        int sellPrice = (int) Math.floor(template.getCost() * 0.5);
        String heroName = template.getDisplayName();

        // Unequip from team slot if equipped
        teamSlotRepository.findByPlayerId(playerId).stream()
                .filter(s -> heroId.equals(s.getHeroId()))
                .findFirst()
                .ifPresent(s -> {
                    s.setHeroId(null);
                    teamSlotRepository.save(s);
                });

        // Return all equipped items to inventory (detach from hero)
        for (EquippedItem ei : equippedItemRepository.findByHeroId(heroId)) {
            ei.setHeroId(null);
            ei.setSlotNumber(null);
            equippedItemRepository.save(ei);
        }

        // Delete all abilities (hero-bound, no value to keep)
        equippedAbilityRepository.deleteAll(equippedAbilityRepository.findByHeroId(heroId));

        // Award gold
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new HeroSellException("PLAYER_NOT_FOUND", "Player not found."));
        player.setGold(player.getGold() + sellPrice);
        playerRepository.save(player);

        heroRepository.delete(hero);

        return Map.of(
                "message", heroName + " sold for " + sellPrice + " gold.",
                "goldEarned", sellPrice,
                "goldTotal", player.getGold()
        );
    }

    public static Map<String, Double> buildHeroStats(HeroTemplate t, int level) {
        return Map.of(
                "physicalAttack", t.getBasePa() + t.getGrowthPa() * (level - 1),
                "magicPower", t.getBaseMp() + t.getGrowthMp() * (level - 1),
                "dexterity", t.getBaseDex() + t.getGrowthDex() * (level - 1),
                "element", t.getBaseElem() + t.getGrowthElem() * (level - 1),
                "mana", t.getBaseMana() + t.getGrowthMana() * (level - 1),
                "stamina", t.getBaseStam() + t.getGrowthStam() * (level - 1)
        );
    }

    public static class HeroSellException extends RuntimeException {
        private final String errorCode;
        public HeroSellException(String errorCode, String message) {
            super(message);
            this.errorCode = errorCode;
        }
        public String getErrorCode() { return errorCode; }
    }
}
