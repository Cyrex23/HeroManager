package com.heromanager.service;

import com.heromanager.entity.*;
import com.heromanager.repository.*;
import com.heromanager.util.BattleCalculator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class BattleService {

    private final TeamSlotRepository teamSlotRepository;
    private final HeroRepository heroRepository;
    private final SummonRepository summonRepository;
    private final EquippedItemRepository equippedItemRepository;
    private final EquippedAbilityRepository equippedAbilityRepository;

    public BattleService(TeamSlotRepository teamSlotRepository,
                         HeroRepository heroRepository,
                         SummonRepository summonRepository,
                         EquippedItemRepository equippedItemRepository,
                         EquippedAbilityRepository equippedAbilityRepository) {
        this.teamSlotRepository = teamSlotRepository;
        this.heroRepository = heroRepository;
        this.summonRepository = summonRepository;
        this.equippedItemRepository = equippedItemRepository;
        this.equippedAbilityRepository = equippedAbilityRepository;
    }

    public record HeroSlot(Hero hero, int slotNumber) {}
    public record TeamData(List<HeroSlot> heroSlots, Summon summon, double summonMpBonus, String username, String profileImagePath) {}

    public TeamData loadTeam(Long playerId, String username, String profileImagePath) {
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

        return new TeamData(heroSlots, summon, summonMpBonus, username, profileImagePath);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> simulateBattle(TeamData challengerTeam, TeamData defenderTeam) {
        List<Map<String, Object>> rounds = new ArrayList<>();
        Map<String, Integer> challengerXp = new HashMap<>();
        Map<String, Integer> defenderXp = new HashMap<>();

        int cIdx = 0;
        int dIdx = 0;
        int cConsecWins = 0;
        int dConsecWins = 0;
        int roundNumber = 0;

        List<HeroSlot> cSlots = challengerTeam.heroSlots();
        List<HeroSlot> dSlots = defenderTeam.heroSlots();

        // ── Mana pools: sum of each hero's mana stat ──────────────────────────
        Random random = new Random();
        double cManaTotal = 0;
        double dManaTotal = 0;
        for (HeroSlot hs : cSlots) {
            Map<String, Double> s = buildBattleStats(hs.hero(), hs.slotNumber(), challengerTeam.summonMpBonus());
            cManaTotal += s.getOrDefault("mana", 0.0);
        }
        for (HeroSlot hs : dSlots) {
            Map<String, Double> s = buildBattleStats(hs.hero(), hs.slotNumber(), defenderTeam.summonMpBonus());
            dManaTotal += s.getOrDefault("mana", 0.0);
        }
        double cMana = cManaTotal;
        double dMana = dManaTotal;

        // Track which heroes have already fired their ENTRANCE spell
        Set<Long> cEntranceFired = new HashSet<>();
        Set<Long> dEntranceFired = new HashSet<>();

        while (cIdx < cSlots.size() && dIdx < dSlots.size()) {
            roundNumber++;
            HeroSlot cSlot = cSlots.get(cIdx);
            HeroSlot dSlot = dSlots.get(dIdx);
            Hero cHero = cSlot.hero();
            Hero dHero = dSlot.hero();

            Map<String, Double> cStats = buildBattleStats(cHero, cSlot.slotNumber(), challengerTeam.summonMpBonus());
            Map<String, Double> dStats = buildBattleStats(dHero, dSlot.slotNumber(), defenderTeam.summonMpBonus());

            // ── Challenger spell resolution ───────────────────────────────────
            List<Map<String, Object>> cSpells = new ArrayList<>();
            boolean cIsNew = !cEntranceFired.contains(cHero.getId());
            for (EquippedAbility ea : equippedAbilityRepository.findByHeroIdAndSlotNumberIsNotNull(cHero.getId())) {
                AbilityTemplate at = ea.getAbilityTemplate();
                if (at == null || at.getSpellName() == null || at.getSpellTrigger() == null) continue;
                boolean fires = ("ENTRANCE".equals(at.getSpellTrigger()) && cIsNew)
                        || "ATTACK".equals(at.getSpellTrigger());
                if (!fires || cMana < at.getSpellManaCost()) continue;
                if (random.nextDouble() >= at.getSpellChance()) continue;
                cMana -= at.getSpellManaCost();
                if (at.getSpellBonusPa() != 0) cStats.merge("physicalAttack", at.getSpellBonusPa(), Double::sum);
                if (at.getSpellBonusMp() != 0) cStats.merge("magicPower", at.getSpellBonusMp(), Double::sum);
                if (at.getSpellBonusDex() != 0) cStats.merge("dexterity", at.getSpellBonusDex(), Double::sum);
                if (at.getSpellBonusElem() != 0) cStats.merge("element", at.getSpellBonusElem(), Double::sum);
                if (at.getSpellBonusMana() != 0) cStats.merge("mana", at.getSpellBonusMana(), Double::sum);
                if (at.getSpellBonusStam() != 0) cStats.merge("stamina", at.getSpellBonusStam(), Double::sum);
                Map<String, Object> ev = new LinkedHashMap<>();
                ev.put("spellName", at.getSpellName());
                ev.put("manaCost", at.getSpellManaCost());
                ev.put("heroName", cHero.getTemplate().getDisplayName());
                ev.put("trigger", at.getSpellTrigger());
                cSpells.add(ev);
            }
            cEntranceFired.add(cHero.getId());

            // ── Defender spell resolution ─────────────────────────────────────
            List<Map<String, Object>> dSpells = new ArrayList<>();
            boolean dIsNew = !dEntranceFired.contains(dHero.getId());
            for (EquippedAbility ea : equippedAbilityRepository.findByHeroIdAndSlotNumberIsNotNull(dHero.getId())) {
                AbilityTemplate at = ea.getAbilityTemplate();
                if (at == null || at.getSpellName() == null || at.getSpellTrigger() == null) continue;
                boolean fires = ("ENTRANCE".equals(at.getSpellTrigger()) && dIsNew)
                        || "ATTACK".equals(at.getSpellTrigger());
                if (!fires || dMana < at.getSpellManaCost()) continue;
                if (random.nextDouble() >= at.getSpellChance()) continue;
                dMana -= at.getSpellManaCost();
                if (at.getSpellBonusPa() != 0) dStats.merge("physicalAttack", at.getSpellBonusPa(), Double::sum);
                if (at.getSpellBonusMp() != 0) dStats.merge("magicPower", at.getSpellBonusMp(), Double::sum);
                if (at.getSpellBonusDex() != 0) dStats.merge("dexterity", at.getSpellBonusDex(), Double::sum);
                if (at.getSpellBonusElem() != 0) dStats.merge("element", at.getSpellBonusElem(), Double::sum);
                if (at.getSpellBonusMana() != 0) dStats.merge("mana", at.getSpellBonusMana(), Double::sum);
                if (at.getSpellBonusStam() != 0) dStats.merge("stamina", at.getSpellBonusStam(), Double::sum);
                Map<String, Object> ev = new LinkedHashMap<>();
                ev.put("spellName", at.getSpellName());
                ev.put("manaCost", at.getSpellManaCost());
                ev.put("heroName", dHero.getTemplate().getDisplayName());
                ev.put("trigger", at.getSpellTrigger());
                dSpells.add(ev);
            }
            dEntranceFired.add(dHero.getId());

            double cStaminaEff = Math.min(1.0, cStats.getOrDefault("stamina", 0.0) / (60.0 + cHero.getLevel() * 2.5));
            double dStaminaEff = Math.min(1.0, dStats.getOrDefault("stamina", 0.0) / (60.0 + dHero.getLevel() * 2.5));
            double cStamina = getTurnCapacity(cConsecWins, cStaminaEff);
            double dStamina = getTurnCapacity(dConsecWins, dStaminaEff);
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

            // ── Spell events & mana tracking ──────────────────────────────────
            if (!cSpells.isEmpty()) round.put("challengerSpells", cSpells);
            if (!dSpells.isEmpty()) round.put("defenderSpells", dSpells);
            round.put("challengerManaAfter", Math.round(cMana * 10.0) / 10.0);
            round.put("defenderManaAfter", Math.round(dMana * 10.0) / 10.0);

            if (cAttack > dAttack) {
                round.put("winner", "attacker");
                int xp = 4 + 2 * dHero.getLevel();
                challengerXp.merge(cHero.getTemplate().getDisplayName(), xp, Integer::sum);
                cConsecWins++;
                dConsecWins = 0;
                cHero.setClashesWon(cHero.getClashesWon() + 1);
                cHero.setCurrentWinStreak(cHero.getCurrentWinStreak() + 1);
                cHero.setCurrentLossStreak(0);
                dHero.setClashesLost(dHero.getClashesLost() + 1);
                dHero.setCurrentLossStreak(dHero.getCurrentLossStreak() + 1);
                dHero.setCurrentWinStreak(0);
                if (cAttack > cHero.getMaxDamageDealt()) cHero.setMaxDamageDealt(cAttack);
                if (dAttack > dHero.getMaxDamageDealt()) dHero.setMaxDamageDealt(dAttack);
                if (dAttack > cHero.getMaxDamageReceived()) cHero.setMaxDamageReceived(dAttack);
                if (cAttack > dHero.getMaxDamageReceived()) dHero.setMaxDamageReceived(cAttack);
                dIdx++;
            } else {
                round.put("winner", "defender");
                int xp = 4 + 2 * cHero.getLevel();
                defenderXp.merge(dHero.getTemplate().getDisplayName(), xp, Integer::sum);
                dConsecWins++;
                cConsecWins = 0;
                dHero.setClashesWon(dHero.getClashesWon() + 1);
                dHero.setCurrentWinStreak(dHero.getCurrentWinStreak() + 1);
                dHero.setCurrentLossStreak(0);
                cHero.setClashesLost(cHero.getClashesLost() + 1);
                cHero.setCurrentLossStreak(cHero.getCurrentLossStreak() + 1);
                cHero.setCurrentWinStreak(0);
                if (dAttack > dHero.getMaxDamageDealt()) dHero.setMaxDamageDealt(dAttack);
                if (cAttack > cHero.getMaxDamageDealt()) cHero.setMaxDamageDealt(cAttack);
                if (cAttack > dHero.getMaxDamageReceived()) dHero.setMaxDamageReceived(cAttack);
                if (dAttack > cHero.getMaxDamageReceived()) cHero.setMaxDamageReceived(dAttack);
                cIdx++;
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

        Map<String, Object> challengerInfo = new LinkedHashMap<>();
        challengerInfo.put("username", challengerTeam.username());
        if (challengerTeam.profileImagePath() != null) challengerInfo.put("profileImagePath", challengerTeam.profileImagePath());
        challengerInfo.put("heroes", challengerTeam.heroSlots().stream().map(hs -> {
            Map<String, Object> h = new LinkedHashMap<>();
            h.put("name", hs.hero().getTemplate().getDisplayName());
            h.put("imagePath", hs.hero().getTemplate().getImagePath() != null ? hs.hero().getTemplate().getImagePath() : "");
            h.put("level", hs.hero().getLevel());
            if (hs.hero().getTemplate().getElement() != null) h.put("element", hs.hero().getTemplate().getElement().name());
            return h;
        }).toList());
        if (challengerTeam.summon() != null) {
            Map<String, Object> s = new LinkedHashMap<>();
            s.put("name", challengerTeam.summon().getTemplate().getDisplayName());
            s.put("imagePath", challengerTeam.summon().getTemplate().getImagePath() != null ? challengerTeam.summon().getTemplate().getImagePath() : "");
            challengerInfo.put("summon", s);
        }

        Map<String, Object> defenderInfo = new LinkedHashMap<>();
        defenderInfo.put("username", defenderTeam.username());
        if (defenderTeam.profileImagePath() != null) defenderInfo.put("profileImagePath", defenderTeam.profileImagePath());
        defenderInfo.put("heroes", defenderTeam.heroSlots().stream().map(hs -> {
            Map<String, Object> h = new LinkedHashMap<>();
            h.put("name", hs.hero().getTemplate().getDisplayName());
            h.put("imagePath", hs.hero().getTemplate().getImagePath() != null ? hs.hero().getTemplate().getImagePath() : "");
            h.put("level", hs.hero().getLevel());
            if (hs.hero().getTemplate().getElement() != null) h.put("element", hs.hero().getTemplate().getElement().name());
            return h;
        }).toList());
        if (defenderTeam.summon() != null) {
            Map<String, Object> s = new LinkedHashMap<>();
            s.put("name", defenderTeam.summon().getTemplate().getDisplayName());
            s.put("imagePath", defenderTeam.summon().getTemplate().getImagePath() != null ? defenderTeam.summon().getTemplate().getImagePath() : "");
            defenderInfo.put("summon", s);
        }

        result.put("challenger", challengerInfo);
        result.put("defender", defenderInfo);
        result.put("rounds", rounds);
        result.put("winner", winner);
        result.put("xpGained", Map.of("challenger", challengerXp, "defender", defenderXp));
        result.put("summonXp", Map.of("challenger", challengerSummonXp, "defender", defenderSummonXp));
        result.put("challengerManaTotal", Math.round(cManaTotal * 10.0) / 10.0);
        result.put("defenderManaTotal", Math.round(dManaTotal * 10.0) / 10.0);

        return result;
    }

    private Map<String, Double> buildBattleStats(Hero hero, int slotNumber, double summonMpBonus) {
        Map<String, Double> stats = new HashMap<>(PlayerService.buildHeroStats(hero.getTemplate(), hero.getLevel()));
        // Equipment bonuses
        for (EquippedItem ei : equippedItemRepository.findByHeroIdAndSlotNumberIsNotNull(hero.getId())) {
            ItemTemplate t = ei.getItemTemplate();
            if (t == null) continue;
            stats.merge("physicalAttack", t.getBonusPa(), Double::sum);
            stats.merge("magicPower", t.getBonusMp(), Double::sum);
            stats.merge("dexterity", t.getBonusDex(), Double::sum);
            stats.merge("element", t.getBonusElem(), Double::sum);
            stats.merge("mana", t.getBonusMana(), Double::sum);
            stats.merge("stamina", t.getBonusStam(), Double::sum);
        }
        for (EquippedAbility ea : equippedAbilityRepository.findByHeroIdAndSlotNumberIsNotNull(hero.getId())) {
            AbilityTemplate at = ea.getAbilityTemplate();
            if (at == null) continue;
            stats.merge("physicalAttack", at.getBonusPa(), Double::sum);
            stats.merge("magicPower", at.getBonusMp(), Double::sum);
            stats.merge("dexterity", at.getBonusDex(), Double::sum);
            stats.merge("element", at.getBonusElem(), Double::sum);
            stats.merge("mana", at.getBonusMana(), Double::sum);
            stats.merge("stamina", at.getBonusStam(), Double::sum);
        }
        if (summonMpBonus > 0) {
            stats.put("magicPower", stats.get("magicPower") + summonMpBonus);
        }
        // Off-slot debuff: proportional stamina penalty when hero tier doesn't match slot tier
        HeroTier heroTier = hero.getTemplate().getTier();
        if (heroTier != null) {
            String slotTier = TeamService.getSlotTier(slotNumber);
            if (!heroTier.name().equals(slotTier)) {
                double heroStamina = stats.getOrDefault("stamina", 0.0);
                double requiredStamina = switch (slotTier) {
                    case "COMMONER"  ->  50.0 + hero.getLevel() * 3.0;
                    case "ELITE"     -> 100.0 + hero.getLevel() * 3.0;
                    case "LEGENDARY" -> 150.0 + hero.getLevel() * 3.0;
                    default -> Double.MAX_VALUE;
                };
                double maxPenalty = switch (slotTier) {
                    case "COMMONER"  -> 0.80;
                    case "ELITE"     -> 0.65;
                    case "LEGENDARY" -> 0.50;
                    default -> 0.0;
                };
                if (heroStamina < requiredStamina) {
                    double penalty = maxPenalty * (1.0 - heroStamina / requiredStamina);
                    stats.put("stamina", heroStamina * (1.0 - penalty));
                }
            }
        }
        return stats;
    }

    /**
     * Capacity modifier based on how many consecutive wins this hero has scored.
     * staEff = min(1.0, heroStaminaStat / (60 + level * 2.5))
     */
    private double getTurnCapacity(int consecWins, double staEff) {
        return switch (consecWins) {
            case 0 -> 1.0;
            case 1 -> (60 + 35 * staEff) / 100.0;
            case 2 -> (30 + 50 * staEff) / 100.0;
            case 3 -> (10 + 55 * staEff) / 100.0;
            case 4 -> (50 * staEff) / 100.0;
            case 5 -> (35 * staEff) / 100.0;
            case 6 -> (20 * staEff) / 100.0;
            default -> (5 * staEff) / 100.0;
        };
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
