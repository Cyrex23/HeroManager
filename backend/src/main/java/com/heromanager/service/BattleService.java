package com.heromanager.service;

import com.heromanager.entity.*;
import com.heromanager.repository.*;
import com.heromanager.util.BattleCalculator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class BattleService {

    private final HeroRepository heroRepository;
    private final SummonRepository summonRepository;
    private final TeamSlotRepository teamSlotRepository;
    private final EquippedItemRepository equippedItemRepository;
    private final EquippedAbilityRepository equippedAbilityRepository;

    public BattleService(HeroRepository heroRepository,
                         SummonRepository summonRepository,
                         TeamSlotRepository teamSlotRepository,
                         EquippedItemRepository equippedItemRepository,
                         EquippedAbilityRepository equippedAbilityRepository) {
        this.heroRepository = heroRepository;
        this.summonRepository = summonRepository;
        this.teamSlotRepository = teamSlotRepository;
        this.equippedItemRepository = equippedItemRepository;
        this.equippedAbilityRepository = equippedAbilityRepository;
    }

    public static class TeamFighter {
        public Long heroId;
        public String heroName;
        public int level;
        public Map<String, Double> totalStats;
        public double staminaModifier = 1.0;

        public TeamFighter(Long heroId, String heroName, int level, Map<String, Double> totalStats) {
            this.heroId = heroId;
            this.heroName = heroName;
            this.level = level;
            this.totalStats = totalStats;
        }
    }

    public List<TeamFighter> buildTeamFighters(Long playerId) {
        List<TeamSlot> slots = teamSlotRepository.findByPlayerId(playerId);
        slots.sort(Comparator.comparingInt(TeamSlot::getSlotNumber));

        // Get summon bonus
        double summonMpBonus = 0;
        for (TeamSlot slot : slots) {
            if (slot.getSlotNumber() == 7 && slot.getSummonId() != null) {
                Summon summon = summonRepository.findById(slot.getSummonId()).orElse(null);
                if (summon != null) {
                    SummonTemplate st = summon.getTemplate();
                    summonMpBonus = st.getBaseMp() + st.getGrowthMp() * (summon.getLevel() - 1);
                }
                break;
            }
        }

        List<TeamFighter> fighters = new ArrayList<>();
        for (TeamSlot slot : slots) {
            if (slot.getHeroId() == null || slot.getSlotNumber() > 6) continue;
            Hero hero = heroRepository.findById(slot.getHeroId()).orElse(null);
            if (hero == null) continue;

            HeroTemplate t = hero.getTemplate();
            int level = hero.getLevel();

            Map<String, Double> totalStats = new LinkedHashMap<>();
            totalStats.put("pa", t.getBasePa() + t.getGrowthPa() * (level - 1));
            totalStats.put("mp", t.getBaseMp() + t.getGrowthMp() * (level - 1));
            totalStats.put("dex", t.getBaseDex() + t.getGrowthDex() * (level - 1));
            totalStats.put("elem", t.getBaseElem() + t.getGrowthElem() * (level - 1));
            totalStats.put("mana", t.getBaseMana() + t.getGrowthMana() * (level - 1));
            totalStats.put("stam", t.getBaseStam() + t.getGrowthStam() * (level - 1));

            // Add item bonuses
            List<EquippedItem> items = equippedItemRepository.findByHeroId(hero.getId());
            for (EquippedItem ei : items) {
                ItemTemplate it = ei.getItemTemplate();
                totalStats.merge("pa", it.getBonusPa(), Double::sum);
                totalStats.merge("mp", it.getBonusMp(), Double::sum);
                totalStats.merge("dex", it.getBonusDex(), Double::sum);
                totalStats.merge("elem", it.getBonusElem(), Double::sum);
                totalStats.merge("mana", it.getBonusMana(), Double::sum);
                totalStats.merge("stam", it.getBonusStam(), Double::sum);
            }

            // Add ability bonuses
            List<EquippedAbility> abilities = equippedAbilityRepository.findByHeroId(hero.getId());
            for (EquippedAbility ea : abilities) {
                AbilityTemplate at = ea.getAbilityTemplate();
                totalStats.merge("pa", at.getBonusPa(), Double::sum);
                totalStats.merge("mp", at.getBonusMp(), Double::sum);
                totalStats.merge("dex", at.getBonusDex(), Double::sum);
                totalStats.merge("elem", at.getBonusElem(), Double::sum);
                totalStats.merge("mana", at.getBonusMana(), Double::sum);
                totalStats.merge("stam", at.getBonusStam(), Double::sum);
            }

            // Add summon MP bonus
            totalStats.merge("mp", summonMpBonus, Double::sum);

            fighters.add(new TeamFighter(hero.getId(), t.getDisplayName(), level, totalStats));
        }

        return fighters;
    }

    public Map<String, Object> simulateBattle(Long challengerId, Long defenderId,
                                               List<TeamFighter> challengerTeam,
                                               List<TeamFighter> defenderTeam) {
        List<Map<String, Object>> rounds = new ArrayList<>();
        Map<String, Integer> challengerXp = new LinkedHashMap<>();
        Map<String, Integer> defenderXp = new LinkedHashMap<>();

        int cIdx = 0;
        int dIdx = 0;
        int roundNumber = 0;

        while (cIdx < challengerTeam.size() && dIdx < defenderTeam.size()) {
            roundNumber++;
            TeamFighter attacker = challengerTeam.get(cIdx);
            TeamFighter defender = defenderTeam.get(dIdx);

            double attackerValue = BattleCalculator.calculateCombatPower(attacker.totalStats, attacker.staminaModifier);
            double defenderValue = BattleCalculator.calculateCombatPower(defender.totalStats, defender.staminaModifier);

            Map<String, Object> round = new LinkedHashMap<>();
            round.put("roundNumber", roundNumber);
            round.put("attackerHero", attacker.heroName);
            round.put("attackerLevel", attacker.level);
            round.put("attackerAttackValue", Math.round(attackerValue * 100.0) / 100.0);
            round.put("defenderHero", defender.heroName);
            round.put("defenderLevel", defender.level);
            round.put("defenderAttackValue", Math.round(defenderValue * 100.0) / 100.0);
            round.put("attackerStaminaModifier", Math.round(attacker.staminaModifier * 100.0) / 100.0);
            round.put("defenderStaminaModifier", Math.round(defender.staminaModifier * 100.0) / 100.0);

            if (attackerValue > defenderValue) {
                round.put("winner", "attacker");
                // Attacker wins, stays with stamina decay
                attacker.staminaModifier *= 0.9;
                // Attacker earns XP for defeating defender
                int xp = 4 + 2 * defender.level;
                challengerXp.merge(attacker.heroName, xp, Integer::sum);
                dIdx++; // Defender's hero is out
            } else {
                // Ties favor defender
                round.put("winner", "defender");
                defender.staminaModifier *= 0.9;
                int xp = 4 + 2 * attacker.level;
                defenderXp.merge(defender.heroName, xp, Integer::sum);
                cIdx++; // Challenger's hero is out
            }

            rounds.add(round);
        }

        String winner = cIdx < challengerTeam.size() ? "challenger" : "defender";

        Map<String, Object> battleLog = new LinkedHashMap<>();

        List<String> challengerHeroNames = challengerTeam.stream().map(f -> f.heroName).toList();
        List<String> defenderHeroNames = defenderTeam.stream().map(f -> f.heroName).toList();

        battleLog.put("challenger", Map.of("heroes", challengerHeroNames));
        battleLog.put("defender", Map.of("heroes", defenderHeroNames));
        battleLog.put("rounds", rounds);
        battleLog.put("winner", winner);
        battleLog.put("xpGained", Map.of("challenger", challengerXp, "defender", defenderXp));

        // Summon XP: +1 for winning team's summon
        Map<String, Integer> summonXp = new LinkedHashMap<>();
        summonXp.put("challenger", "challenger".equals(winner) ? 1 : 0);
        summonXp.put("defender", "defender".equals(winner) ? 1 : 0);
        battleLog.put("summonXp", summonXp);

        return battleLog;
    }

    @Transactional
    public void applyBattleRewards(Long challengerId, Long defenderId, Map<String, Object> battleLog) {
        String winner = (String) battleLog.get("winner");

        // Apply hero XP
        Map<String, Map<String, Integer>> xpGained = (Map<String, Map<String, Integer>>) battleLog.get("xpGained");

        applyHeroXp(challengerId, xpGained.get("challenger"));
        applyHeroXp(defenderId, xpGained.get("defender"));

        // Apply summon XP
        Map<String, Integer> summonXp = (Map<String, Integer>) battleLog.get("summonXp");
        if (summonXp.get("challenger") > 0) applySummonXp(challengerId);
        if (summonXp.get("defender") > 0) applySummonXp(defenderId);
    }

    private void applyHeroXp(Long playerId, Map<String, Integer> heroXpMap) {
        if (heroXpMap == null || heroXpMap.isEmpty()) return;

        List<Hero> heroes = heroRepository.findByPlayerId(playerId);
        for (Hero hero : heroes) {
            String displayName = hero.getTemplate().getDisplayName();
            if (heroXpMap.containsKey(displayName)) {
                int xpGained = heroXpMap.get(displayName);
                hero.setCurrentXp(hero.getCurrentXp() + xpGained);

                // Check for level-ups
                int threshold = (int) Math.pow(hero.getLevel(), 2) * 10;
                while (hero.getCurrentXp() >= threshold) {
                    hero.setCurrentXp(hero.getCurrentXp() - threshold);
                    hero.setLevel(hero.getLevel() + 1);
                    threshold = (int) Math.pow(hero.getLevel(), 2) * 10;
                }

                heroRepository.save(hero);
            }
        }
    }

    private void applySummonXp(Long playerId) {
        List<TeamSlot> slots = teamSlotRepository.findByPlayerId(playerId);
        for (TeamSlot slot : slots) {
            if (slot.getSlotNumber() == 7 && slot.getSummonId() != null) {
                Summon summon = summonRepository.findById(slot.getSummonId()).orElse(null);
                if (summon != null) {
                    summon.setCurrentXp(summon.getCurrentXp() + 1);
                    int threshold = (int) Math.pow(summon.getLevel(), 2) * 10;
                    while (summon.getCurrentXp() >= threshold) {
                        summon.setCurrentXp(summon.getCurrentXp() - threshold);
                        summon.setLevel(summon.getLevel() + 1);
                        threshold = (int) Math.pow(summon.getLevel(), 2) * 10;
                    }
                    summonRepository.save(summon);
                }
                break;
            }
        }
    }
}
