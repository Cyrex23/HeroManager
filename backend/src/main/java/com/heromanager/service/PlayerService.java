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
                .arenaEnergyMax(player.isEnergyPlusPurchased() ? 140 : 120)
                .worldEnergy(player.getWorldEnergy())
                .worldEnergyMax(player.isEnergyPlusPurchased() ? 140 : 120)
                .nextEnergyTickSeconds(energyService.getNextTickSeconds(player))
                .isOnline(isOnline)
                .onlineMinutesRemaining(onlineMinutes)
                .profileImagePath(player.getProfileImagePath())
                .teamName(player.getTeamName() != null ? player.getTeamName() : player.getUsername())
                .chatSoundEnabled(player.isChatSoundEnabled())
                .extraLineupGoldPurchased(player.isExtraLineupGoldPurchased())
                .extraLineupDiamondsPurchased(player.isExtraLineupDiamondsPurchased())
                .energyPlusPurchased(player.isEnergyPlusPurchased())
                .heroPlusCapacityPurchased(player.isHeroPlusCapacityPurchased())
                .capacityPlusCount(player.getCapacityPlusCount())
                .statResetUnlocked(player.isStatResetUnlocked())
                .extraCraftingSlotPurchased(player.isExtraCraftingSlotPurchased())
                .doubleSpinPurchased(player.isDoubleSpinPurchased())
                .battleLogUnlocked(player.isBattleLogUnlocked())
                .returnCapUpgraded(player.isReturnCapUpgraded())
                .challengeLimitUpgraded(player.isChallengeLimitUpgraded())
                .energyGainUpgraded(player.isEnergyGainUpgraded())
                .nextTickGain(player.isEnergyGainUpgraded() ? 1.5 : 1.0)
                .lineupSlots(6 + (player.isExtraLineupGoldPurchased() ? 1 : 0) + (player.isExtraLineupDiamondsPurchased() ? 1 : 0))
                .heroRosterMax(player.isHeroPlusCapacityPurchased() ? 40 : 20)
                .teamCapacityMax(100 + player.getCapacityPlusCount() * 10)
                .build();
    }

    @Transactional(readOnly = true)
    public HeroResponse getHero(Long playerId, Long heroId) {
        Hero hero = heroRepository.findByIdAndPlayerId(heroId, playerId)
                .orElse(null);
        if (hero == null || hero.getTemplate() == null) return null;

        HeroTemplate t = hero.getTemplate();
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
        Map<String, Double> bonusStats = buildEquipmentBonuses(heroId);
        Map<String, Double> summonStats = buildSummonBonuses(playerId);
        Map<String, Double> totalStats = new HashMap<>(stats);
        bonusStats.forEach((k, v) -> totalStats.merge(k, v, Double::sum));
        summonStats.forEach((k, v) -> totalStats.merge(k, v, Double::sum));

        List<TeamSlot> teamSlots = teamSlotRepository.findByPlayerId(playerId);
        Integer slotNum = teamSlots.stream()
                .filter(s -> heroId.equals(s.getHeroId()))
                .map(TeamSlot::getSlotNumber)
                .findFirst().orElse(null);

        int capacity = hero.getCapacityOverride() != null ? hero.getCapacityOverride() : t.getCapacity();
        return HeroResponse.builder()
                .id(hero.getId())
                .templateId(hero.getTemplateId())
                .name(t.getDisplayName())
                .imagePath(t.getImagePath())
                .level(level)
                .currentXp(hero.getCurrentXp())
                .xpToNextLevel(level * level * 10)
                .capacity(capacity)
                .isEquipped(slotNum != null)
                .teamSlot(slotNum)
                .stats(totalStats)
                .baseStats(baseStats)
                .growthStats(growthStats)
                .bonusStats(bonusStats)
                .summonStats(summonStats)
                .equippedItems(Collections.emptyList())
                .equippedAbilities(Collections.emptyList())
                .tier(t.getTier() != null ? t.getTier().name() : null)
                .element(hero.getElementOverride() != null ? hero.getElementOverride() : (t.getElement() != null ? t.getElement().name() : null))
                .clashesWon(hero.getClashesWon())
                .clashesLost(hero.getClashesLost())
                .currentWinStreak(hero.getCurrentWinStreak())
                .currentLossStreak(hero.getCurrentLossStreak())
                .maxDamageDealt(hero.getMaxDamageDealt())
                .maxDamageReceived(hero.getMaxDamageReceived())
                .sellPrice((int) Math.floor(t.getCost() * 0.5))
                .statPurchaseCount(hero.getStatPurchaseCount())
                .nextStatCost(computeNextStatCost(t, hero.getStatPurchaseCount()))
                .unallocatedStatPoints(hero.getUnallocatedStatPoints())
                .statResetCount(hero.getStatResetCount())
                .nextResetCost(computeNextResetCost(hero.getStatResetCount()))
                .seal(hero.getSeal())
                .sealPoints(computeSealPoints(hero.getLevel(), hero.getSealChanges()))
                .capacityHalved(hero.getCapacityOverride() != null)
                .purchasedStats(Map.of(
                        "physicalAttack", hero.getBonusPa(),
                        "magicPower",     hero.getBonusMp(),
                        "dexterity",      hero.getBonusDex(),
                        "element",        hero.getBonusElem(),
                        "mana",           hero.getBonusMana(),
                        "stamina",        hero.getBonusStam()
                ))
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

        Map<String, Double> summonStats = buildSummonBonuses(playerId);

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
            summonStats.forEach((k, v) -> totalStats.merge(k, v, Double::sum));

            Integer slotNum = heroSlotMap.get(hero.getId());

            int heroCap = hero.getCapacityOverride() != null ? hero.getCapacityOverride() : t.getCapacity();
            result.add(HeroResponse.builder()
                    .id(hero.getId())
                    .templateId(hero.getTemplateId())
                    .name(t.getDisplayName())
                    .imagePath(t.getImagePath())
                    .level(level)
                    .currentXp(hero.getCurrentXp())
                    .xpToNextLevel(level * level * 10)
                    .capacity(heroCap)
                    .isEquipped(slotNum != null)
                    .teamSlot(slotNum)
                    .stats(totalStats)
                    .baseStats(baseStats)
                    .growthStats(growthStats)
                    .bonusStats(bonusStats)
                    .summonStats(summonStats)
                    .equippedItems(Collections.emptyList())
                    .equippedAbilities(Collections.emptyList())
                    .tier(t.getTier() != null ? t.getTier().name() : null)
                    .element(hero.getElementOverride() != null ? hero.getElementOverride() : (t.getElement() != null ? t.getElement().name() : null))
                    .clashesWon(hero.getClashesWon())
                    .clashesLost(hero.getClashesLost())
                    .currentWinStreak(hero.getCurrentWinStreak())
                    .currentLossStreak(hero.getCurrentLossStreak())
                    .maxDamageDealt(hero.getMaxDamageDealt())
                    .maxDamageReceived(hero.getMaxDamageReceived())
                    .sellPrice((int) Math.floor(t.getCost() * 0.5))
                    .statPurchaseCount(hero.getStatPurchaseCount())
                    .nextStatCost(computeNextStatCost(t, hero.getStatPurchaseCount()))
                    .seal(hero.getSeal())
                    .sealPoints(computeSealPoints(hero.getLevel(), hero.getSealChanges()))
                    .capacityHalved(hero.getCapacityOverride() != null)
                    .purchasedStats(Map.of(
                            "physicalAttack", hero.getBonusPa(),
                            "magicPower",     hero.getBonusMp(),
                            "dexterity",      hero.getBonusDex(),
                            "element",        hero.getBonusElem(),
                            "mana",           hero.getBonusMana(),
                            "stamina",        hero.getBonusStam()
                    ))
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
            Map<String, Double> stats = buildSummonStats(t, level);

            result.add(SummonResponse.builder()
                    .id(summon.getId())
                    .templateId(summon.getTemplateId())
                    .name(t.getDisplayName())
                    .imagePath(t.getImagePath())
                    .level(level)
                    .currentXp(summon.getCurrentXp())
                    .xpToNextLevel(level * level * 10)
                    .capacity(summon.getCapacityOverride() != null ? summon.getCapacityOverride() : t.getCapacity())
                    .isEquipped(equippedSummonIds.contains(summon.getId()))
                    .stats(stats)
                    .teamBonus(buildSummonTeamBonusString(stats))
                    .sellPrice((int) Math.floor(t.getCost() * 0.5))
                    .capacityHalved(summon.getCapacityOverride() != null)
                    .build());
        }
        return result;
    }

    public Map<String, Double> buildEquipmentBonuses(Long heroId) {
        Map<String, Double> bonuses = new HashMap<>();

        // ── Base sub-stat defaults (shown in UI for all heroes) ───────────────
        bonuses.put("dexProficiency", 0.33);  // all heroes start at 33% DEX proficiency
        bonuses.put("dexPosture",     0.20);  // all heroes start at 20% DEX stamina immunity
        bonuses.put("critDamage",     0.25);  // all heroes start at +25% bonus crit multiplier

        // Include purchased stat bonuses from the hero itself
        Hero hero = heroRepository.findById(heroId).orElse(null);
        if (hero != null) {
            bonuses.merge("physicalAttack", hero.getBonusPa(), Double::sum);
            bonuses.merge("magicPower",     hero.getBonusMp(),  Double::sum);
            bonuses.merge("dexterity",      hero.getBonusDex(), Double::sum);
            bonuses.merge("element",        hero.getBonusElem(), Double::sum);
            bonuses.merge("mana",           hero.getBonusMana(), Double::sum);
            bonuses.merge("stamina",        hero.getBonusStam(), Double::sum);
        }
        for (EquippedItem ei : equippedItemRepository.findByHeroIdAndSlotNumberIsNotNull(heroId)) {
            ItemTemplate t = ei.getItemTemplate();
            if (t == null) continue;
            bonuses.merge("physicalAttack",  t.getBonusPa(),               Double::sum);
            bonuses.merge("magicPower",      t.getBonusMp(),               Double::sum);
            bonuses.merge("dexterity",       t.getBonusDex(),              Double::sum);
            bonuses.merge("element",         t.getBonusElem(),             Double::sum);
            bonuses.merge("mana",            t.getBonusMana(),             Double::sum);
            bonuses.merge("stamina",         t.getBonusStam(),             Double::sum);
            bonuses.merge("attack",          t.getBonusAttack(),           Double::sum);
            bonuses.merge("magicProficiency",t.getBonusMagicProficiency(), Double::sum);
            bonuses.merge("spellMastery",    t.getBonusSpellMastery(),     Double::sum);
            bonuses.merge("spellActivation", t.getBonusSpellActivation(),  Double::sum);
            bonuses.merge("dexProficiency",  t.getBonusDexProficiency(),   Double::sum);
            bonuses.merge("dexPosture",      t.getBonusDexPosture(),       Double::sum);
            bonuses.merge("critChance",      t.getBonusCritChance(),       Double::sum);
            bonuses.merge("critDamage",      t.getBonusCritDamage(),       Double::sum);
            bonuses.merge("expBonus",        t.getBonusExpBonus(),         Double::sum);
            bonuses.merge("goldBonus",       t.getBonusGoldBonus(),        Double::sum);
            bonuses.merge("itemDiscovery",   t.getBonusItemDiscovery(),    Double::sum);
            bonuses.merge("physicalImmunity",t.getBonusPhysicalImmunity(), Double::sum);
            bonuses.merge("magicImmunity",   t.getBonusMagicImmunity(),    Double::sum);
            bonuses.merge("dexEvasiveness",  t.getBonusDexEvasiveness(),   Double::sum);
        }
        for (EquippedAbility ea : equippedAbilityRepository.findByHeroIdAndSlotNumberIsNotNull(heroId)) {
            AbilityTemplate at = ea.getAbilityTemplate();
            if (at == null) continue;
            bonuses.merge("physicalAttack",  at.getBonusPa(),               Double::sum);
            bonuses.merge("magicPower",      at.getBonusMp(),               Double::sum);
            bonuses.merge("dexterity",       at.getBonusDex(),              Double::sum);
            bonuses.merge("element",         at.getBonusElem(),             Double::sum);
            bonuses.merge("mana",            at.getBonusMana(),             Double::sum);
            bonuses.merge("stamina",         at.getBonusStam(),             Double::sum);
            bonuses.merge("attack",          at.getBonusAttack(),           Double::sum);
            bonuses.merge("magicProficiency",at.getBonusMagicProficiency(), Double::sum);
            bonuses.merge("spellMastery",    at.getBonusSpellMastery(),     Double::sum);
            bonuses.merge("spellActivation", at.getBonusSpellActivation(),  Double::sum);
            bonuses.merge("dexProficiency",  at.getBonusDexProficiency(),   Double::sum);
            bonuses.merge("dexPosture",      at.getBonusDexPosture(),       Double::sum);
            bonuses.merge("critChance",      at.getBonusCritChance(),       Double::sum);
            bonuses.merge("critDamage",      at.getBonusCritDamage(),       Double::sum);
            bonuses.merge("expBonus",        at.getBonusExpBonus(),         Double::sum);
            bonuses.merge("goldBonus",       at.getBonusGoldBonus(),        Double::sum);
            bonuses.merge("itemDiscovery",   at.getBonusItemDiscovery(),    Double::sum);
            bonuses.merge("physicalImmunity",at.getBonusPhysicalImmunity(), Double::sum);
            bonuses.merge("magicImmunity",   at.getBonusMagicImmunity(),    Double::sum);
            bonuses.merge("dexEvasiveness",  at.getBonusDexEvasiveness(),   Double::sum);
        }
        return bonuses;
    }

    public Map<String, Double> buildSummonBonuses(Long playerId) {
        Map<String, Double> bonuses = new HashMap<>();
        teamSlotRepository.findByPlayerIdAndSlotNumber(playerId, 7).ifPresent(slot -> {
            if (slot.getSummonId() == null) return;
            summonRepository.findById(slot.getSummonId()).ifPresent(summon -> {
                SummonTemplate st = summon.getTemplate();
                if (st == null) return;
                Map<String, Double> ss = buildSummonStats(st, summon.getLevel());
                // Flat stats (same key, same units as bonusStats)
                for (String k : new String[]{"magicPower","mana","dexterity","attack","stamina","physicalAttack"})
                    if (ss.containsKey(k)) bonuses.merge(k, ss.get(k), Double::sum);
                if (ss.containsKey("spellMastery"))     bonuses.merge("spellMastery",     ss.get("spellMastery")     / 100.0, Double::sum);
                // Percentage stats: summon stores as raw %, bonusStats uses decimal (/100)
                if (ss.containsKey("magicProficiency")) bonuses.merge("magicProficiency", ss.get("magicProficiency") / 100.0, Double::sum);
                if (ss.containsKey("critChance"))       bonuses.merge("critChance",       ss.get("critChance")       / 100.0, Double::sum);
                if (ss.containsKey("critDamage"))       bonuses.merge("critDamage",       ss.get("critDamage")       / 100.0, Double::sum);
                if (ss.containsKey("dexProficiency"))   bonuses.merge("dexProficiency",   ss.get("dexProficiency")   / 100.0, Double::sum);
                if (ss.containsKey("dexPosture"))       bonuses.merge("dexPosture",       ss.get("dexPosture")       / 100.0, Double::sum);
                if (ss.containsKey("goldBonus"))        bonuses.merge("goldBonus",        ss.get("goldBonus")        / 100.0, Double::sum);
                if (ss.containsKey("xpBonus"))          bonuses.merge("expBonus",         ss.get("xpBonus")          / 100.0, Double::sum);
                if (ss.containsKey("spellActivation"))  bonuses.merge("spellActivation",  ss.get("spellActivation")  / 100.0, Double::sum);
                if (ss.containsKey("itemFind"))         bonuses.merge("itemDiscovery",    ss.get("itemFind"),               Double::sum);
            });
        });
        return bonuses;
    }

    private static int computeNextResetCost(int statResetCount) {
        return 1000 * (1 << statResetCount);  // 1000, 2000, 4000, 8000, …
    }

    private static int computeSealPoints(int level, int sealChanges) {
        return Math.max(0, level / 4 - sealChanges);
    }

    private static int computeNextStatCost(HeroTemplate t, int statPurchaseCount) {
        int base = 50;
        if (t.getTier() != null) {
            switch (t.getTier()) {
                case ELITE -> base = 100;
                case LEGENDARY -> base = 150;
                default -> base = 50;
            }
        }
        return base * (1 << statPurchaseCount);
    }

    // Seal level → [magicProficiency%, criticalChance%, spellActivation%]
    private static final int[][] SEAL_STATS = {
        // index 0 = seal -10, index 10 = seal 0, index 20 = seal +10
        {35, 25,  1}, {33, 24,  1}, {32, 23,  2}, {30, 21,  2}, {28, 20,  3},
        {26, 19,  4}, {25, 18,  5}, {23, 16,  5}, {21, 15,  6}, {19, 14,  7},
        {18, 13,  7}, {16, 11,  8}, {14, 10,  8}, {12,  8,  9}, {11,  8, 10},
        { 9,  7, 11}, { 7,  6, 11}, { 5,  5, 12}, { 4,  4, 13}, { 2,  3, 14},
        { 2,  1, 15}
    };

    public static int[] getSealStats(int seal) {
        int idx = seal + 10;  // -10→0, 0→10, +10→20
        return SEAL_STATS[Math.max(0, Math.min(20, idx))];
    }

    @Transactional
    public Map<String, Object> changeSeal(Long playerId, Long heroId, String direction) {
        Hero hero = heroRepository.findByIdAndPlayerId(heroId, playerId)
                .orElseThrow(() -> new IllegalArgumentException("Hero not found."));

        int available = computeSealPoints(hero.getLevel(), hero.getSealChanges());
        if (available <= 0)
            throw new IllegalArgumentException("No seal points available.");

        int currentSeal = hero.getSeal();
        if ("up".equals(direction)) {
            if (currentSeal >= 10)
                throw new IllegalArgumentException("Seal is already at maximum (+10).");
            hero.setSeal(currentSeal + 1);
        } else if ("down".equals(direction)) {
            if (currentSeal <= -10)
                throw new IllegalArgumentException("Seal is already at minimum (-10).");
            hero.setSeal(currentSeal - 1);
        } else {
            throw new IllegalArgumentException("Invalid direction. Use 'up' or 'down'.");
        }

        hero.setSealChanges(hero.getSealChanges() + 1);
        heroRepository.save(hero);

        int[] stats = getSealStats(hero.getSeal());
        return Map.of(
                "message", "Seal changed to " + hero.getSeal() + ".",
                "seal", hero.getSeal(),
                "sealPoints", computeSealPoints(hero.getLevel(), hero.getSealChanges()),
                "magicProficiency", stats[0],
                "criticalChance", stats[1],
                "spellActivation", stats[2]
        );
    }

    @Transactional
    public Map<String, Object> changeElement(Long playerId, Long heroId, String element) {
        Hero hero = heroRepository.findByIdAndPlayerId(heroId, playerId)
                .orElseThrow(() -> new IllegalArgumentException("Hero not found."));
        try {
            HeroElement.valueOf(element);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid element: " + element);
        }
        HeroTemplate t = hero.getTemplate();
        int cost;
        if (t.getTier() == null) cost = 75;
        else cost = switch (t.getTier()) {
            case LEGENDARY -> 300;
            case ELITE -> 150;
            default -> 75;
        };
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new IllegalArgumentException("Player not found."));
        if (player.getGold() < cost)
            throw new IllegalArgumentException("Not enough gold. Requires " + cost + "g.");
        player.setGold(player.getGold() - cost);
        hero.setElementOverride(element);
        playerRepository.save(player);
        heroRepository.save(hero);
        return Map.of(
                "message", "Element changed to " + element + ".",
                "element", element,
                "goldSpent", cost,
                "goldTotal", player.getGold()
        );
    }

    @Transactional
    public Map<String, Object> halveCapacity(Long playerId, Long heroId) {
        Hero hero = heroRepository.findByIdAndPlayerId(heroId, playerId)
                .orElseThrow(() -> new IllegalArgumentException("Hero not found."));
        HeroTemplate t = hero.getTemplate();
        if (t == null) throw new IllegalArgumentException("Hero template not found.");

        if (hero.getCapacityOverride() != null)
            throw new IllegalArgumentException("Capacity has already been halved for this hero.");

        int currentCap = t.getCapacity();
        if (currentCap <= 1) throw new IllegalArgumentException("Capacity is already at minimum.");

        int cost = (int) Math.floor(t.getCost() * 0.5);
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new IllegalArgumentException("Player not found."));
        if (player.getGold() < cost) throw new IllegalArgumentException("Not enough gold.");

        player.setGold(player.getGold() - cost);
        playerRepository.save(player);

        hero.setCapacityOverride(Math.max(1, currentCap / 2));
        heroRepository.save(hero);

        return Map.of(
                "message", t.getDisplayName() + "'s capacity reduced to " + hero.getCapacityOverride() + ".",
                "newCapacity", hero.getCapacityOverride(),
                "goldSpent", cost,
                "goldTotal", player.getGold()
        );
    }

    @Transactional
    public Map<String, Object> buyStats(Long playerId, Long heroId) {
        Hero hero = heroRepository.findByIdAndPlayerId(heroId, playerId)
                .orElseThrow(() -> new IllegalArgumentException("Hero not found."));
        HeroTemplate t = hero.getTemplate();
        if (t == null) throw new IllegalArgumentException("Hero template not found.");

        int cost = computeNextStatCost(t, hero.getStatPurchaseCount());
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new IllegalArgumentException("Player not found."));
        if (player.getGold() < cost) throw new IllegalArgumentException("Not enough gold.");

        player.setGold(player.getGold() - cost);
        playerRepository.save(player);

        hero.setStatPurchaseCount(hero.getStatPurchaseCount() + 1);
        hero.setUnallocatedStatPoints(hero.getUnallocatedStatPoints() + 6);
        heroRepository.save(hero);

        return Map.of(
                "message", "6 stat points added for " + t.getDisplayName() + "!",
                "goldSpent", cost,
                "goldTotal", player.getGold(),
                "unallocatedStatPoints", hero.getUnallocatedStatPoints()
        );
    }

    @Transactional
    public Map<String, Object> allocateStats(Long playerId, Long heroId, Map<String, Integer> allocation) {
        Hero hero = heroRepository.findByIdAndPlayerId(heroId, playerId)
                .orElseThrow(() -> new IllegalArgumentException("Hero not found."));
        HeroTemplate t = hero.getTemplate();
        if (t == null) throw new IllegalArgumentException("Hero template not found.");

        if (allocation.values().stream().anyMatch(v -> v < 0))
            throw new IllegalArgumentException("No negative values allowed.");

        int total = allocation.values().stream().mapToInt(Integer::intValue).sum();
        if (total == 0) throw new IllegalArgumentException("Must allocate at least 1 point.");
        if (total > hero.getUnallocatedStatPoints())
            throw new IllegalArgumentException("Not enough unallocated points.");

        hero.setBonusPa(hero.getBonusPa()     + allocation.getOrDefault("physicalAttack", 0));
        hero.setBonusMp(hero.getBonusMp()     + allocation.getOrDefault("magicPower", 0));
        hero.setBonusDex(hero.getBonusDex()   + allocation.getOrDefault("dexterity", 0));
        hero.setBonusElem(hero.getBonusElem() + allocation.getOrDefault("element", 0));
        hero.setBonusMana(hero.getBonusMana() + allocation.getOrDefault("mana", 0));
        hero.setBonusStam(hero.getBonusStam() + allocation.getOrDefault("stamina", 0));
        hero.setUnallocatedStatPoints(hero.getUnallocatedStatPoints() - total);
        heroRepository.save(hero);

        return Map.of(
                "message", total + " points allocated for " + t.getDisplayName() + "!",
                "pointsAllocated", total,
                "unallocatedStatPoints", hero.getUnallocatedStatPoints()
        );
    }

    @Transactional
    public Map<String, Object> resetHeroStats(Long playerId, Long heroId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new IllegalArgumentException("Player not found."));
        if (!player.isStatResetUnlocked())
            throw new IllegalArgumentException("Stat Reset is not unlocked. Purchase it in the Shop.");

        Hero hero = heroRepository.findByIdAndPlayerId(heroId, playerId)
                .orElseThrow(() -> new IllegalArgumentException("Hero not found."));
        HeroTemplate t = hero.getTemplate();
        if (t == null) throw new IllegalArgumentException("Hero template not found.");

        int cost = computeNextResetCost(hero.getStatResetCount());
        if (player.getGold() < cost)
            throw new IllegalArgumentException("Not enough gold. Reset costs " + cost + "g.");

        int totalBonusPoints = (int)(hero.getBonusPa() + hero.getBonusMp() + hero.getBonusDex()
                + hero.getBonusElem() + hero.getBonusMana() + hero.getBonusStam());

        player.setGold(player.getGold() - cost);
        playerRepository.save(player);

        hero.setBonusPa(0); hero.setBonusMp(0); hero.setBonusDex(0);
        hero.setBonusElem(0); hero.setBonusMana(0); hero.setBonusStam(0);
        hero.setUnallocatedStatPoints(hero.getUnallocatedStatPoints() + totalBonusPoints);
        hero.setStatResetCount(hero.getStatResetCount() + 1);
        heroRepository.save(hero);

        return Map.of(
                "message", "Stats reset for " + t.getDisplayName() + "! " + totalBonusPoints + " points returned to pool.",
                "goldSpent", cost,
                "goldTotal", player.getGold(),
                "unallocatedStatPoints", hero.getUnallocatedStatPoints()
        );
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

    @Transactional(readOnly = true)
    public SummonResponse getSummon(Long playerId, Long summonId) {
        Summon summon = summonRepository.findByIdAndPlayerId(summonId, playerId)
                .orElse(null);
        if (summon == null) return null;
        SummonTemplate t = summon.getTemplate();
        if (t == null) return null;
        int level = summon.getLevel();
        Map<String, Double> stats = buildSummonStats(t, level);
        List<TeamSlot> slots = teamSlotRepository.findByPlayerId(playerId);
        boolean equipped = slots.stream().anyMatch(s -> summonId.equals(s.getSummonId()));
        return SummonResponse.builder()
                .id(summon.getId())
                .templateId(summon.getTemplateId())
                .name(t.getDisplayName())
                .imagePath(t.getImagePath())
                .level(level)
                .currentXp(summon.getCurrentXp())
                .xpToNextLevel(level * level * 10)
                .capacity(summon.getCapacityOverride() != null ? summon.getCapacityOverride() : t.getCapacity())
                .isEquipped(equipped)
                .stats(stats)
                .teamBonus(buildSummonTeamBonusString(stats))
                .sellPrice((int) Math.floor(t.getCost() * 0.5))
                .capacityHalved(summon.getCapacityOverride() != null)
                .build();
    }

    @Transactional
    public Map<String, Object> sellSummon(Long playerId, Long summonId) {
        Summon summon = summonRepository.findByIdAndPlayerId(summonId, playerId)
                .orElseThrow(() -> new IllegalArgumentException("Summon not found."));
        SummonTemplate t = summon.getTemplate();
        if (t == null) throw new IllegalArgumentException("Summon template not found.");

        int sellPrice = (int) Math.floor(t.getCost() * 0.5);
        String summonName = t.getDisplayName();

        // Unequip from team slot if equipped
        teamSlotRepository.findByPlayerId(playerId).stream()
                .filter(s -> summonId.equals(s.getSummonId()))
                .findFirst()
                .ifPresent(s -> { s.setSummonId(null); teamSlotRepository.save(s); });

        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new IllegalArgumentException("Player not found."));
        player.setGold(player.getGold() + sellPrice);
        playerRepository.save(player);

        summonRepository.delete(summon);

        return Map.of(
                "message", summonName + " sold for " + sellPrice + " gold.",
                "goldEarned", sellPrice,
                "goldTotal", player.getGold()
        );
    }

    @Transactional
    public Map<String, Object> halveSummonCapacity(Long playerId, Long summonId) {
        Summon summon = summonRepository.findByIdAndPlayerId(summonId, playerId)
                .orElseThrow(() -> new IllegalArgumentException("Summon not found."));
        SummonTemplate t = summon.getTemplate();
        if (t == null) throw new IllegalArgumentException("Summon template not found.");

        if (summon.getCapacityOverride() != null)
            throw new IllegalArgumentException("Capacity has already been halved for this summon.");

        int currentCap = t.getCapacity();
        if (currentCap <= 1) throw new IllegalArgumentException("Capacity is already at minimum.");

        int cost = (int) Math.floor(t.getCost() * 0.5);
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new IllegalArgumentException("Player not found."));
        if (player.getGold() < cost) throw new IllegalArgumentException("Not enough gold.");

        player.setGold(player.getGold() - cost);
        playerRepository.save(player);

        summon.setCapacityOverride(Math.max(1, currentCap / 2));
        summonRepository.save(summon);

        return Map.of(
                "message", t.getDisplayName() + "'s capacity reduced to " + summon.getCapacityOverride() + ".",
                "newCapacity", summon.getCapacityOverride(),
                "goldSpent", cost,
                "goldTotal", player.getGold()
        );
    }

    public static Map<String, Double> buildSummonStats(SummonTemplate t, int level) {
        int lv = level - 1;
        Map<String, Double> stats = new LinkedHashMap<>();
        double mana         = t.getBaseMana()             + t.getGrowthMana()             * lv;
        double mp           = t.getBaseMp()              + t.getGrowthMp()              * lv;
        double magicProf    = t.getBaseMagicProficiency() + t.getGrowthMagicProficiency() * lv;
        double spellMastery = t.getBaseSpellMastery()     + t.getGrowthSpellMastery()     * lv;
        double critChance   = t.getBaseCritChance()       + t.getGrowthCritChance()       * lv;
        double critDamage   = t.getBaseCritDamage()       + t.getGrowthCritDamage()       * lv;
        double dex          = t.getBaseDex()              + t.getGrowthDex()              * lv;
        double dexProf      = t.getBaseDexProficiency()   + t.getGrowthDexProficiency()   * lv;
        double dexPosture   = t.getBaseDexPosture()       + t.getGrowthDexPosture()       * lv;
        double goldBonus        = t.getBaseGoldBonus()        + t.getGrowthGoldBonus()        * lv;
        double itemFind         = t.getBaseItemFind()         + t.getGrowthItemFind()         * lv;
        double xpBonus          = t.getBaseXpBonus()          + t.getGrowthXpBonus()          * lv;
        double attack           = t.getBaseAttack()           + t.getGrowthAttack()           * lv;
        double spellActivation  = t.getBaseSpellActivation()  + t.getGrowthSpellActivation()  * lv;
        double stamina          = t.getBaseStamina()          + t.getGrowthStamina()          * lv;
        double physicalAttack   = t.getBasePhysicalAttack()   + t.getGrowthPhysicalAttack()   * lv;
        if (mana         != 0) stats.put("mana",              mana);
        if (mp           != 0) stats.put("magicPower",       mp);
        if (magicProf    != 0) stats.put("magicProficiency", magicProf);
        if (spellMastery != 0) stats.put("spellMastery",     spellMastery);
        if (critChance   != 0) stats.put("critChance",       critChance);
        if (critDamage   != 0) stats.put("critDamage",       critDamage);
        if (dex          != 0) stats.put("dexterity",        dex);
        if (dexProf      != 0) stats.put("dexProficiency",   dexProf);
        if (dexPosture   != 0) stats.put("dexPosture",       dexPosture);
        if (goldBonus       != 0) stats.put("goldBonus",       goldBonus);
        if (itemFind        != 0) stats.put("itemFind",        itemFind);
        if (xpBonus         != 0) stats.put("xpBonus",        xpBonus);
        if (attack          != 0) stats.put("attack",          attack);
        if (spellActivation != 0) stats.put("spellActivation", spellActivation);
        if (stamina         != 0) stats.put("stamina",         stamina);
        if (physicalAttack  != 0) stats.put("physicalAttack",  physicalAttack);
        return stats;
    }

    public static String buildSummonTeamBonusString(Map<String, Double> stats) {
        List<String> parts = new ArrayList<>();
        if (stats.containsKey("mana"))             parts.add("+" + (int)(double) stats.get("mana")             + " Mana");
        if (stats.containsKey("magicPower"))       parts.add("+" + (int)(double) stats.get("magicPower")       + " Magic Power");
        if (stats.containsKey("magicProficiency")) parts.add("+" + Math.round(stats.get("magicProficiency"))   + "% Magic Prof");
        if (stats.containsKey("spellMastery"))     parts.add("+" + (int)(double) stats.get("spellMastery")     + " Spell Mastery");
        if (stats.containsKey("critChance"))       parts.add("+" + Math.round(stats.get("critChance"))         + "% Crit Chance");
        if (stats.containsKey("critDamage"))       parts.add("+" + Math.round(stats.get("critDamage"))         + "% Crit Damage");
        if (stats.containsKey("dexterity"))        parts.add("+" + (int)(double) stats.get("dexterity")        + " Dexterity");
        if (stats.containsKey("dexProficiency"))   parts.add("+" + Math.round(stats.get("dexProficiency"))     + "% Dex Prof");
        if (stats.containsKey("dexPosture"))       parts.add("+" + Math.round(stats.get("dexPosture"))         + "% Dex Posture");
        if (stats.containsKey("goldBonus"))        parts.add("+" + Math.round(stats.get("goldBonus"))          + "% Gold");
        if (stats.containsKey("itemFind"))         parts.add("+" + (int)(double) stats.get("itemFind")         + " Item Find");
        if (stats.containsKey("xpBonus"))          parts.add("+" + Math.round(stats.get("xpBonus"))            + "% XP");
        if (stats.containsKey("attack"))           parts.add("+" + (int)(double) stats.get("attack")           + " Attack");
        if (stats.containsKey("spellActivation"))  parts.add("+" + Math.round(stats.get("spellActivation"))    + "% Spell Activation");
        if (stats.containsKey("stamina"))          parts.add("+" + (int)(double) stats.get("stamina")          + " Stamina");
        if (stats.containsKey("physicalAttack"))   parts.add("+" + (int)(double) stats.get("physicalAttack")   + " Phys Attack");
        return String.join(", ", parts);
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
