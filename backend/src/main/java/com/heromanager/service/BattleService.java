package com.heromanager.service;

import com.heromanager.entity.*;
import com.heromanager.repository.HeroRepository;
import com.heromanager.repository.SummonRepository;
import com.heromanager.repository.TeamSlotRepository;
import com.heromanager.util.BattleCalculator;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class BattleService {

    private final TeamSlotRepository teamSlotRepository;
    private final HeroRepository heroRepository;
    private final SummonRepository summonRepository;

    public BattleService(TeamSlotRepository teamSlotRepository,
                         HeroRepository heroRepository,
                         SummonRepository summonRepository) {
        this.teamSlotRepository = teamSlotRepository;
        this.heroRepository = heroRepository;
        this.summonRepository = summonRepository;
    }

    public record HeroSlot(Hero hero, int slotNumber) {}
    public record TeamData(List<HeroSlot> heroSlots, Summon summon, double summonMpBonus, String username) {}

    public TeamData loadTeam(Long playerId, String username) {
        List<TeamSlot> slots = teamSlotRepository.findByPlayerId(playerId);
        slots.sort(Comparator.comparingInt(TeamSlot::getSlotNumber));

        List<HeroSlot> heroSlots = new ArrayList<>();
        Summon summon = null;
        double summonMpBonus = 0;

        for (TeamSlot slot : slots) {
            if (slot.getHeroId() != null && slot.getSlotNumber() <= 6) {
                heroRepository.findById(slot.getHeroId())
                        .ifPresent(h -> heroSlots.add(new HeroSlot(h, slot.getSlotNumber())));
            }
            if (slot.getSummonId() != null && slot.getSlotNumber() == 7) {
                summon = summonRepository.findById(slot.getSummonId()).orElse(null);
                if (summon != null) {
                    SummonTemplate st = summon.getTemplate();
                    summonMpBonus = st.getBaseMp() + st.getGrowthMp() * (summon.getLevel() - 1);
                }
            }
        }

        return new TeamData(heroSlots, summon, summonMpBonus, username);
    }

    public Map<String, Object> simulateBattle(TeamData challengerTeam, TeamData defenderTeam) {
        List<Map<String, Object>> rounds = new ArrayList<>();
        Map<String, Integer> challengerXp = new HashMap<>();
        Map<String, Integer> defenderXp = new HashMap<>();

        int cIdx = 0;
        int dIdx = 0;
        double cStamina = 1.0;
        double dStamina = 1.0;
        int roundNumber = 0;

        List<HeroSlot> cSlots = challengerTeam.heroSlots();
        List<HeroSlot> dSlots = defenderTeam.heroSlots();

        while (cIdx < cSlots.size() && dIdx < dSlots.size()) {
            roundNumber++;
            HeroSlot cSlot = cSlots.get(cIdx);
            HeroSlot dSlot = dSlots.get(dIdx);
            Hero cHero = cSlot.hero();
            Hero dHero = dSlot.hero();

            Map<String, Double> cStats = buildBattleStats(cHero, cSlot.slotNumber(), challengerTeam.summonMpBonus());
            Map<String, Double> dStats = buildBattleStats(dHero, dSlot.slotNumber(), defenderTeam.summonMpBonus());

            BattleCalculator.AttackBreakdown cBreak = BattleCalculator.calculateAttack(cStats, cStamina);
            BattleCalculator.AttackBreakdown dBreak = BattleCalculator.calculateAttack(dStats, dStamina);
            double cAttack = cBreak.finalAttack();
            double dAttack = dBreak.finalAttack();

            // Element bonus damage
            double cElemBonus = calculateElementBonus(cHero, dHero);
            double dElemBonus = calculateElementBonus(dHero, cHero);
            cAttack += cElemBonus;
            dAttack += dElemBonus;

            Map<String, Object> round = new LinkedHashMap<>();
            round.put("roundNumber", roundNumber);
            round.put("attackerHero", cHero.getTemplate().getDisplayName());
            round.put("attackerLevel", cHero.getLevel());
            round.put("attackerAttackValue", Math.round(cAttack * 100.0) / 100.0);
            round.put("defenderHero", dHero.getTemplate().getDisplayName());
            round.put("defenderLevel", dHero.getLevel());
            round.put("defenderAttackValue", Math.round(dAttack * 100.0) / 100.0);
            round.put("attackerStaminaModifier", Math.round(cStamina * 100.0) / 100.0);
            round.put("defenderStaminaModifier", Math.round(dStamina * 100.0) / 100.0);
            round.put("attackerPaContrib", Math.round(cBreak.paContrib() * 100.0) / 100.0);
            round.put("attackerMpContrib", Math.round(cBreak.mpContrib() * 100.0) / 100.0);
            round.put("attackerDexContrib", Math.round(cBreak.dexContrib() * 100.0) / 100.0);
            round.put("attackerRawAttack", Math.round(cBreak.rawAttack() * 100.0) / 100.0);
            if (cBreak.staminaReduction() > 0.001) round.put("attackerStaminaReduction", Math.round(cBreak.staminaReduction() * 100.0) / 100.0);
            round.put("attackerStatPa", Math.round(cStats.getOrDefault("physicalAttack", 0.0) * 100.0) / 100.0);
            round.put("attackerStatMp", Math.round(cStats.getOrDefault("magicPower", 0.0) * 100.0) / 100.0);
            round.put("attackerStatDex", Math.round(cStats.getOrDefault("dexterity", 0.0) * 100.0) / 100.0);
            round.put("attackerStatElem", Math.round(cStats.getOrDefault("element", 0.0) * 100.0) / 100.0);
            round.put("attackerStatMana", Math.round(cStats.getOrDefault("mana", 0.0) * 100.0) / 100.0);
            round.put("attackerStatStam", Math.round(cStats.getOrDefault("stamina", 0.0) * 100.0) / 100.0);
            if (cHero.getTemplate().getElement() != null) round.put("attackerElement", cHero.getTemplate().getElement().name());
            round.put("defenderPaContrib", Math.round(dBreak.paContrib() * 100.0) / 100.0);
            round.put("defenderMpContrib", Math.round(dBreak.mpContrib() * 100.0) / 100.0);
            round.put("defenderDexContrib", Math.round(dBreak.dexContrib() * 100.0) / 100.0);
            round.put("defenderRawAttack", Math.round(dBreak.rawAttack() * 100.0) / 100.0);
            if (dBreak.staminaReduction() > 0.001) round.put("defenderStaminaReduction", Math.round(dBreak.staminaReduction() * 100.0) / 100.0);
            round.put("defenderStatPa", Math.round(dStats.getOrDefault("physicalAttack", 0.0) * 100.0) / 100.0);
            round.put("defenderStatMp", Math.round(dStats.getOrDefault("magicPower", 0.0) * 100.0) / 100.0);
            round.put("defenderStatDex", Math.round(dStats.getOrDefault("dexterity", 0.0) * 100.0) / 100.0);
            round.put("defenderStatElem", Math.round(dStats.getOrDefault("element", 0.0) * 100.0) / 100.0);
            round.put("defenderStatMana", Math.round(dStats.getOrDefault("mana", 0.0) * 100.0) / 100.0);
            round.put("defenderStatStam", Math.round(dStats.getOrDefault("stamina", 0.0) * 100.0) / 100.0);
            if (dHero.getTemplate().getElement() != null) round.put("defenderElement", dHero.getTemplate().getElement().name());
            round.put("attackerImagePath", cHero.getTemplate().getImagePath() != null ? cHero.getTemplate().getImagePath() : "");
            round.put("defenderImagePath", dHero.getTemplate().getImagePath() != null ? dHero.getTemplate().getImagePath() : "");
            if (cElemBonus > 0) round.put("attackerElementBonus", Math.round(cElemBonus * 100.0) / 100.0);
            if (dElemBonus > 0) round.put("defenderElementBonus", Math.round(dElemBonus * 100.0) / 100.0);

            if (cAttack > dAttack) {
                round.put("winner", "attacker");
                int xp = 4 + 2 * dHero.getLevel();
                challengerXp.merge(cHero.getTemplate().getDisplayName(), xp, Integer::sum);
                cStamina *= 0.9;
                cHero.setClashesWon(cHero.getClashesWon() + 1);
                dHero.setClashesLost(dHero.getClashesLost() + 1);
                if (cAttack > cHero.getMaxDamageDealt()) cHero.setMaxDamageDealt(cAttack);
                if (dAttack > dHero.getMaxDamageDealt()) dHero.setMaxDamageDealt(dAttack);
                if (dAttack > cHero.getMaxDamageReceived()) cHero.setMaxDamageReceived(dAttack);
                if (cAttack > dHero.getMaxDamageReceived()) dHero.setMaxDamageReceived(cAttack);
                dIdx++;
                dStamina = 1.0;
            } else {
                round.put("winner", "defender");
                int xp = 4 + 2 * cHero.getLevel();
                defenderXp.merge(dHero.getTemplate().getDisplayName(), xp, Integer::sum);
                dStamina *= 0.9;
                dHero.setClashesWon(dHero.getClashesWon() + 1);
                cHero.setClashesLost(cHero.getClashesLost() + 1);
                if (dAttack > dHero.getMaxDamageDealt()) dHero.setMaxDamageDealt(dAttack);
                if (cAttack > cHero.getMaxDamageDealt()) cHero.setMaxDamageDealt(cAttack);
                if (cAttack > dHero.getMaxDamageReceived()) dHero.setMaxDamageReceived(cAttack);
                if (dAttack > cHero.getMaxDamageReceived()) cHero.setMaxDamageReceived(dAttack);
                cIdx++;
                cStamina = 1.0;
            }

            rounds.add(round);
        }

        String winner = cIdx < cSlots.size() ? "challenger" : "defender";

        for (HeroSlot hs : challengerTeam.heroSlots()) {
            Hero hero = hs.hero();
            int xp = challengerXp.getOrDefault(hero.getTemplate().getDisplayName(), 0);
            if (xp > 0) {
                hero.setCurrentXp(hero.getCurrentXp() + xp);
                checkLevelUp(hero);
            }
            heroRepository.save(hero);
        }
        for (HeroSlot hs : defenderTeam.heroSlots()) {
            Hero hero = hs.hero();
            int xp = defenderXp.getOrDefault(hero.getTemplate().getDisplayName(), 0);
            if (xp > 0) {
                hero.setCurrentXp(hero.getCurrentXp() + xp);
                checkLevelUp(hero);
            }
            heroRepository.save(hero);
        }

        int challengerSummonXp = "challenger".equals(winner) ? 1 : 0;
        int defenderSummonXp = "defender".equals(winner) ? 1 : 0;

        if (challengerTeam.summon() != null && challengerSummonXp > 0) {
            Summon s = challengerTeam.summon();
            s.setCurrentXp(s.getCurrentXp() + challengerSummonXp);
            checkSummonLevelUp(s);
            summonRepository.save(s);
        }
        if (defenderTeam.summon() != null && defenderSummonXp > 0) {
            Summon s = defenderTeam.summon();
            s.setCurrentXp(s.getCurrentXp() + defenderSummonXp);
            checkSummonLevelUp(s);
            summonRepository.save(s);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("challenger", Map.of(
                "username", challengerTeam.username(),
                "heroes", challengerTeam.heroSlots().stream().map(hs -> hs.hero().getTemplate().getDisplayName()).toList()));
        result.put("defender", Map.of(
                "username", defenderTeam.username(),
                "heroes", defenderTeam.heroSlots().stream().map(hs -> hs.hero().getTemplate().getDisplayName()).toList()));
        result.put("rounds", rounds);
        result.put("winner", winner);
        result.put("xpGained", Map.of("challenger", challengerXp, "defender", defenderXp));
        result.put("summonXp", Map.of("challenger", challengerSummonXp, "defender", defenderSummonXp));

        return result;
    }

    private Map<String, Double> buildBattleStats(Hero hero, int slotNumber, double summonMpBonus) {
        Map<String, Double> stats = new HashMap<>(PlayerService.buildHeroStats(hero.getTemplate(), hero.getLevel()));
        if (summonMpBonus > 0) {
            stats.put("magicPower", stats.get("magicPower") + summonMpBonus);
        }
        // Off-slot debuff: -20% stamina when hero tier doesn't match slot tier
        HeroTier heroTier = hero.getTemplate().getTier();
        if (heroTier != null) {
            String slotTier = TeamService.getSlotTier(slotNumber);
            if (!heroTier.name().equals(slotTier)) {
                stats.put("stamina", stats.get("stamina") * 0.8);
            }
        }
        return stats;
    }

    private double calculateElementBonus(Hero attacker, Hero defender) {
        HeroElement attackerElem = attacker.getTemplate().getElement();
        HeroElement defenderElem = defender.getTemplate().getElement();
        if (attackerElem == null || defenderElem == null) return 0;
        if (!hasElementAdvantage(attackerElem, defenderElem)) return 0;

        double attackerElemStat = attacker.getTemplate().getBaseElem()
                + attacker.getTemplate().getGrowthElem() * (attacker.getLevel() - 1);
        double defenderElemStat = defender.getTemplate().getBaseElem()
                + defender.getTemplate().getGrowthElem() * (defender.getLevel() - 1);
        if (attackerElemStat <= defenderElemStat) return 0;
        return (attackerElemStat - defenderElemStat) * 5;
    }

    private boolean hasElementAdvantage(HeroElement attacker, HeroElement defender) {
        return switch (attacker) {
            case FIRE      -> defender == HeroElement.WIND;
            case WATER     -> defender == HeroElement.FIRE;
            case LIGHTNING -> defender == HeroElement.EARTH;
            case WIND      -> defender == HeroElement.LIGHTNING;
            case EARTH     -> defender == HeroElement.WATER;
        };
    }

    private void checkLevelUp(Hero hero) {
        int threshold = hero.getLevel() * hero.getLevel() * 10;
        while (hero.getCurrentXp() >= threshold) {
            hero.setCurrentXp(hero.getCurrentXp() - threshold);
            hero.setLevel(hero.getLevel() + 1);
            threshold = hero.getLevel() * hero.getLevel() * 10;
        }
    }

    private void checkSummonLevelUp(Summon summon) {
        int threshold = summon.getLevel() * summon.getLevel() * 10;
        while (summon.getCurrentXp() >= threshold) {
            summon.setCurrentXp(summon.getCurrentXp() - threshold);
            summon.setLevel(summon.getLevel() + 1);
            threshold = summon.getLevel() * summon.getLevel() * 10;
        }
    }
}
