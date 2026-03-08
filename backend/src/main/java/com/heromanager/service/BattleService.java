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
        Map<String, Integer> defenderXp   = new HashMap<>();

        int cIdx = 0, dIdx = 0;
        int cConsecWins = 0, dConsecWins = 0;
        int roundNumber = 0;

        List<HeroSlot> cSlots = challengerTeam.heroSlots();
        List<HeroSlot> dSlots = defenderTeam.heroSlots();

        // ── Pre-battle: mana totals, gold bonus, exp bonus, item discovery ─────
        Random random = new Random();
        double cManaTotal = 0, dManaTotal = 0;
        double cGoldBonus = 0, dGoldBonus = 0;
        double cItemDiscovery = 0, dItemDiscovery = 0;
        Map<Long, Double> cHeroExpBonus = new HashMap<>();
        Map<Long, Double> dHeroExpBonus = new HashMap<>();

        for (HeroSlot hs : cSlots) {
            Map<String, Double> s = buildBattleStats(hs.hero(), hs.slotNumber(), challengerTeam.summonMpBonus());
            cManaTotal       += s.getOrDefault("mana",          0.0);
            cGoldBonus       += s.getOrDefault("goldBonus",     0.0);
            cItemDiscovery   += s.getOrDefault("itemDiscovery", 0.0);
            cHeroExpBonus.put(hs.hero().getId(), s.getOrDefault("expBonus", 0.0));
        }
        for (HeroSlot hs : dSlots) {
            Map<String, Double> s = buildBattleStats(hs.hero(), hs.slotNumber(), defenderTeam.summonMpBonus());
            dManaTotal       += s.getOrDefault("mana",          0.0);
            dGoldBonus       += s.getOrDefault("goldBonus",     0.0);
            dItemDiscovery   += s.getOrDefault("itemDiscovery", 0.0);
            dHeroExpBonus.put(hs.hero().getId(), s.getOrDefault("expBonus", 0.0));
        }

        double cMana = cManaTotal;
        double dMana = dManaTotal;

        // Track which heroes have already fired their ENTRANCE spell
        Set<Long> cEntranceFired = new HashSet<>();
        Set<Long> dEntranceFired = new HashSet<>();

        // ── Weapon spell state tracking ───────────────────────────────────────
        List<ActiveBuff> cBufList = new ArrayList<>();   // buffs currently affecting challenger
        List<ActiveBuff> dBufList = new ArrayList<>();   // buffs currently affecting defender
        Map<String, Integer> cWsUsages = new HashMap<>(); // spellId → uses for current c hero
        Map<String, Integer> dWsUsages = new HashMap<>(); // spellId → uses for current d hero
        int cHeroTurn = 0, dHeroTurn = 0;
        int prevCIdx = -1, prevDIdx = -1;

        while (cIdx < cSlots.size() && dIdx < dSlots.size()) {
            roundNumber++;
            HeroSlot cSlot = cSlots.get(cIdx);
            HeroSlot dSlot = dSlots.get(dIdx);
            Hero cHero = cSlot.hero();
            Hero dHero = dSlot.hero();

            Map<String, Double> cStats = buildBattleStats(cHero, cSlot.slotNumber(), challengerTeam.summonMpBonus());
            Map<String, Double> dStats = buildBattleStats(dHero, dSlot.slotNumber(), defenderTeam.summonMpBonus());

            // ── Hero turn tracking (reset on hero change) ─────────────────────
            if (cIdx != prevCIdx) { cHeroTurn = 0; cWsUsages = new HashMap<>(); prevCIdx = cIdx; }
            if (dIdx != prevDIdx) { dHeroTurn = 0; dWsUsages = new HashMap<>(); prevDIdx = dIdx; }
            cHeroTurn++; dHeroTurn++;

            // ── Apply & tick persistent weapon-spell buffs/debuffs ────────────
            for (ActiveBuff b : cBufList) cStats.merge(b.statKey(), b.value(), Double::sum);
            for (ActiveBuff b : dBufList) dStats.merge(b.statKey(), b.value(), Double::sum);
            cBufList.replaceAll(b -> new ActiveBuff(b.statKey(), b.value(), b.turnsLeft() - 1));
            dBufList.replaceAll(b -> new ActiveBuff(b.statKey(), b.value(), b.turnsLeft() - 1));
            cBufList.removeIf(b -> b.turnsLeft() <= 0);
            dBufList.removeIf(b -> b.turnsLeft() <= 0);

            // ── Spell resolution ──────────────────────────────────────────────
            double cSpellMastery    = cStats.getOrDefault("spellMastery",    0.0);
            double cSpellActivation = cStats.getOrDefault("spellActivation", 0.0);
            double dSpellMastery    = dStats.getOrDefault("spellMastery",    0.0);
            double dSpellActivation = dStats.getOrDefault("spellActivation", 0.0);

            boolean cIsNew = !cEntranceFired.contains(cHero.getId());
            boolean dIsNew = !dEntranceFired.contains(dHero.getId());

            List<Map<String, Object>> cSpells = new ArrayList<>();
            for (EquippedAbility ea : equippedAbilityRepository.findByHeroIdAndSlotNumberIsNotNull(cHero.getId())) {
                AbilityTemplate at = ea.getAbilityTemplate();
                if (at == null || at.getSpellName() == null || at.getSpellTrigger() == null) continue;
                boolean fires = ("ENTRANCE".equals(at.getSpellTrigger()) && cIsNew)
                        || "ATTACK".equals(at.getSpellTrigger());
                if (!fires || cMana < at.getSpellManaCost()) continue;
                // Spell Activation boosts T4 chance; Spell Mastery boosts T3 effect
                double effectiveChance = at.getSpellChance() + (at.getTier() == 4 ? cSpellActivation : 0.0);
                if (random.nextDouble() >= effectiveChance) continue;
                cMana -= at.getSpellManaCost();
                double masteryMult = (at.getTier() == 3 && cSpellMastery > 0) ? (1.0 + cSpellMastery) : 1.0;
                if (at.getSpellBonusPa()   != 0) cStats.merge("physicalAttack", at.getSpellBonusPa()   * masteryMult, Double::sum);
                if (at.getSpellBonusMp()   != 0) cStats.merge("magicPower",     at.getSpellBonusMp()   * masteryMult, Double::sum);
                if (at.getSpellBonusDex()  != 0) cStats.merge("dexterity",      at.getSpellBonusDex()  * masteryMult, Double::sum);
                if (at.getSpellBonusElem() != 0) cStats.merge("element",        at.getSpellBonusElem() * masteryMult, Double::sum);
                if (at.getSpellBonusMana() != 0) cStats.merge("mana",           at.getSpellBonusMana() * masteryMult, Double::sum);
                if (at.getSpellBonusStam() != 0) cStats.merge("stamina",        at.getSpellBonusStam() * masteryMult, Double::sum);
                Map<String, Object> ev = new LinkedHashMap<>();
                ev.put("spellName", at.getSpellName());
                ev.put("manaCost",  at.getSpellManaCost());
                ev.put("heroName",  cHero.getTemplate().getDisplayName());
                ev.put("trigger",   at.getSpellTrigger());
                cSpells.add(ev);
            }
            // ── Weapon spells pre-clash (challenger) ──────────────────────────
            for (EquippedItem ei : equippedItemRepository.findByHeroIdAndSlotNumberIsNotNull(cHero.getId())) {
                ItemTemplate it = ei.getItemTemplate();
                if (it == null) continue;
                for (WeaponSpell ws : it.getSpells()) {
                    if (ws.getSpellTrigger() == null) continue;
                    String wsTrig = ws.getSpellTrigger();
                    if (wsTrig.startsWith("AFTER_CLASH")) continue; // handled post-clash
                    boolean fires = switch (wsTrig) {
                        case "ENTRANCE"          -> cIsNew;
                        case "OPPONENT_ENTRANCE" -> cIsNew || dIsNew;
                        case "ATTACK"            -> true;
                        case "BEFORE_TURN_X"     -> cHeroTurn < ws.getTurnThreshold();
                        case "AFTER_TURN_X"      -> cHeroTurn >= ws.getTurnThreshold();
                        default -> false;
                    };
                    if (!fires || cMana < ws.getSpellManaCost()) continue;
                    String wsKey = ws.getId().toString();
                    if (ws.getMaxUsages() > 0 && cWsUsages.getOrDefault(wsKey, 0) >= ws.getMaxUsages()) continue;
                    if (random.nextDouble() >= ws.getSpellChance() + cSpellActivation) continue;
                    cMana -= ws.getSpellManaCost();
                    cWsUsages.merge(wsKey, 1, Integer::sum);
                    Map<String, Double> target = ws.isAffectsOpponent() ? dStats : cStats;
                    List<ActiveBuff> targetBufs = ws.isAffectsOpponent() ? dBufList : cBufList;
                    applyWeaponSpellBonuses(ws, target, targetBufs, ws.getLastsTurns(), false);
                    Map<String, Object> ev = new LinkedHashMap<>();
                    ev.put("spellName", ws.getSpellName()); ev.put("manaCost", ws.getSpellManaCost());
                    ev.put("heroName", cHero.getTemplate().getDisplayName()); ev.put("trigger", wsTrig);
                    if (ws.isAffectsOpponent()) ev.put("affectsOpponent", true);
                    cSpells.add(ev);
                }
            }
            cEntranceFired.add(cHero.getId());

            List<Map<String, Object>> dSpells = new ArrayList<>();
            for (EquippedAbility ea : equippedAbilityRepository.findByHeroIdAndSlotNumberIsNotNull(dHero.getId())) {
                AbilityTemplate at = ea.getAbilityTemplate();
                if (at == null || at.getSpellName() == null || at.getSpellTrigger() == null) continue;
                boolean fires = ("ENTRANCE".equals(at.getSpellTrigger()) && dIsNew)
                        || "ATTACK".equals(at.getSpellTrigger());
                if (!fires || dMana < at.getSpellManaCost()) continue;
                double effectiveChance = at.getSpellChance() + (at.getTier() == 4 ? dSpellActivation : 0.0);
                if (random.nextDouble() >= effectiveChance) continue;
                dMana -= at.getSpellManaCost();
                double masteryMult = (at.getTier() == 3 && dSpellMastery > 0) ? (1.0 + dSpellMastery) : 1.0;
                if (at.getSpellBonusPa()   != 0) dStats.merge("physicalAttack", at.getSpellBonusPa()   * masteryMult, Double::sum);
                if (at.getSpellBonusMp()   != 0) dStats.merge("magicPower",     at.getSpellBonusMp()   * masteryMult, Double::sum);
                if (at.getSpellBonusDex()  != 0) dStats.merge("dexterity",      at.getSpellBonusDex()  * masteryMult, Double::sum);
                if (at.getSpellBonusElem() != 0) dStats.merge("element",        at.getSpellBonusElem() * masteryMult, Double::sum);
                if (at.getSpellBonusMana() != 0) dStats.merge("mana",           at.getSpellBonusMana() * masteryMult, Double::sum);
                if (at.getSpellBonusStam() != 0) dStats.merge("stamina",        at.getSpellBonusStam() * masteryMult, Double::sum);
                Map<String, Object> ev = new LinkedHashMap<>();
                ev.put("spellName", at.getSpellName());
                ev.put("manaCost",  at.getSpellManaCost());
                ev.put("heroName",  dHero.getTemplate().getDisplayName());
                ev.put("trigger",   at.getSpellTrigger());
                dSpells.add(ev);
            }
            // ── Weapon spells pre-clash (defender) ────────────────────────────
            for (EquippedItem ei : equippedItemRepository.findByHeroIdAndSlotNumberIsNotNull(dHero.getId())) {
                ItemTemplate it = ei.getItemTemplate();
                if (it == null) continue;
                for (WeaponSpell ws : it.getSpells()) {
                    if (ws.getSpellTrigger() == null) continue;
                    String wsTrig = ws.getSpellTrigger();
                    if (wsTrig.startsWith("AFTER_CLASH")) continue;
                    boolean fires = switch (wsTrig) {
                        case "ENTRANCE"          -> dIsNew;
                        case "OPPONENT_ENTRANCE" -> dIsNew || cIsNew;
                        case "ATTACK"            -> true;
                        case "BEFORE_TURN_X"     -> dHeroTurn < ws.getTurnThreshold();
                        case "AFTER_TURN_X"      -> dHeroTurn >= ws.getTurnThreshold();
                        default -> false;
                    };
                    if (!fires || dMana < ws.getSpellManaCost()) continue;
                    String wsKey = ws.getId().toString();
                    if (ws.getMaxUsages() > 0 && dWsUsages.getOrDefault(wsKey, 0) >= ws.getMaxUsages()) continue;
                    if (random.nextDouble() >= ws.getSpellChance() + dSpellActivation) continue;
                    dMana -= ws.getSpellManaCost();
                    dWsUsages.merge(wsKey, 1, Integer::sum);
                    Map<String, Double> target = ws.isAffectsOpponent() ? cStats : dStats;
                    List<ActiveBuff> targetBufs = ws.isAffectsOpponent() ? cBufList : dBufList;
                    applyWeaponSpellBonuses(ws, target, targetBufs, ws.getLastsTurns(), false);
                    Map<String, Object> ev = new LinkedHashMap<>();
                    ev.put("spellName", ws.getSpellName()); ev.put("manaCost", ws.getSpellManaCost());
                    ev.put("heroName", dHero.getTemplate().getDisplayName()); ev.put("trigger", wsTrig);
                    if (ws.isAffectsOpponent()) ev.put("affectsOpponent", true);
                    dSpells.add(ev);
                }
            }
            dEntranceFired.add(dHero.getId());

            // ── Stamina effectiveness ─────────────────────────────────────────
            double cStaminaEff = Math.min(1.0, cStats.getOrDefault("stamina", 0.0) / (60.0 + cHero.getLevel() * 2.5));
            double dStaminaEff = Math.min(1.0, dStats.getOrDefault("stamina", 0.0) / (60.0 + dHero.getLevel() * 2.5));
            double cStamina = getTurnCapacity(cConsecWins, cStaminaEff);
            double dStamina = getTurnCapacity(dConsecWins, dStaminaEff);

            // ── Build modifiers from stats ────────────────────────────────────
            BattleCalculator.BattleModifiers cMods = new BattleCalculator.BattleModifiers(
                    cStats.getOrDefault("attack",           0.0),
                    cStats.getOrDefault("magicProficiency", 0.0),
                    cStats.getOrDefault("dexProficiency",   0.0),
                    cStats.getOrDefault("dexPosture",       0.0),
                    cStats.getOrDefault("critChance",       0.0),
                    cStats.getOrDefault("critDamage",       0.0)
            );
            BattleCalculator.BattleModifiers dMods = new BattleCalculator.BattleModifiers(
                    dStats.getOrDefault("attack",           0.0),
                    dStats.getOrDefault("magicProficiency", 0.0),
                    dStats.getOrDefault("dexProficiency",   0.0),
                    dStats.getOrDefault("dexPosture",       0.0),
                    dStats.getOrDefault("critChance",       0.0),
                    dStats.getOrDefault("critDamage",       0.0)
            );

            // ── Calculate attacks with cross-immunities ────────────────────────
            BattleCalculator.AttackBreakdown cBreak = BattleCalculator.calculateAttack(
                    cStats, cStamina, cMods,
                    dStats.getOrDefault("physicalImmunity", 0.0),
                    dStats.getOrDefault("magicImmunity",    0.0),
                    dStats.getOrDefault("dexEvasiveness",   0.0)
            );
            BattleCalculator.AttackBreakdown dBreak = BattleCalculator.calculateAttack(
                    dStats, dStamina, dMods,
                    cStats.getOrDefault("physicalImmunity", 0.0),
                    cStats.getOrDefault("magicImmunity",    0.0),
                    cStats.getOrDefault("dexEvasiveness",   0.0)
            );
            double cAttack = cBreak.finalAttack();
            double dAttack = dBreak.finalAttack();

            // ── Weapon spells post-clash (challenger) ─────────────────────────
            for (EquippedItem ei : equippedItemRepository.findByHeroIdAndSlotNumberIsNotNull(cHero.getId())) {
                ItemTemplate it = ei.getItemTemplate();
                if (it == null) continue;
                for (WeaponSpell ws : it.getSpells()) {
                    if (ws.getSpellTrigger() == null) continue;
                    String wsTrig = ws.getSpellTrigger();
                    boolean fires = switch (wsTrig) {
                        case "AFTER_CLASH"            -> true;
                        case "AFTER_CLASH_CRIT"       -> cBreak.didCrit();
                        case "AFTER_CLASH_MAGIC_PROF" -> cBreak.didMagicProf();
                        default -> false;
                    };
                    if (!fires || cMana < ws.getSpellManaCost()) continue;
                    String wsKey = ws.getId().toString();
                    if (ws.getMaxUsages() > 0 && cWsUsages.getOrDefault(wsKey, 0) >= ws.getMaxUsages()) continue;
                    if (random.nextDouble() >= ws.getSpellChance() + cSpellActivation) continue;
                    cMana -= ws.getSpellManaCost();
                    cWsUsages.merge(wsKey, 1, Integer::sum);
                    List<ActiveBuff> targetBufs = ws.isAffectsOpponent() ? dBufList : cBufList;
                    applyWeaponSpellBonuses(ws, null, targetBufs, ws.getLastsTurns(), true);
                    Map<String, Object> ev = new LinkedHashMap<>();
                    ev.put("spellName", ws.getSpellName()); ev.put("manaCost", ws.getSpellManaCost());
                    ev.put("heroName", cHero.getTemplate().getDisplayName()); ev.put("trigger", wsTrig);
                    if (ws.isAffectsOpponent()) ev.put("affectsOpponent", true);
                    cSpells.add(ev);
                }
            }
            // ── Weapon spells post-clash (defender) ───────────────────────────
            for (EquippedItem ei : equippedItemRepository.findByHeroIdAndSlotNumberIsNotNull(dHero.getId())) {
                ItemTemplate it = ei.getItemTemplate();
                if (it == null) continue;
                for (WeaponSpell ws : it.getSpells()) {
                    if (ws.getSpellTrigger() == null) continue;
                    String wsTrig = ws.getSpellTrigger();
                    boolean fires = switch (wsTrig) {
                        case "AFTER_CLASH"            -> true;
                        case "AFTER_CLASH_CRIT"       -> dBreak.didCrit();
                        case "AFTER_CLASH_MAGIC_PROF" -> dBreak.didMagicProf();
                        default -> false;
                    };
                    if (!fires || dMana < ws.getSpellManaCost()) continue;
                    String wsKey = ws.getId().toString();
                    if (ws.getMaxUsages() > 0 && dWsUsages.getOrDefault(wsKey, 0) >= ws.getMaxUsages()) continue;
                    if (random.nextDouble() >= ws.getSpellChance() + dSpellActivation) continue;
                    dMana -= ws.getSpellManaCost();
                    dWsUsages.merge(wsKey, 1, Integer::sum);
                    List<ActiveBuff> targetBufs = ws.isAffectsOpponent() ? cBufList : dBufList;
                    applyWeaponSpellBonuses(ws, null, targetBufs, ws.getLastsTurns(), true);
                    Map<String, Object> ev = new LinkedHashMap<>();
                    ev.put("spellName", ws.getSpellName()); ev.put("manaCost", ws.getSpellManaCost());
                    ev.put("heroName", dHero.getTemplate().getDisplayName()); ev.put("trigger", wsTrig);
                    if (ws.isAffectsOpponent()) ev.put("affectsOpponent", true);
                    dSpells.add(ev);
                }
            }

            // ── Element bonus damage ──────────────────────────────────────────
            double cElemBonus = calculateElementBonus(cHero, dHero);
            double dElemBonus = calculateElementBonus(dHero, cHero);
            cAttack += cElemBonus;
            dAttack += dElemBonus;

            // ── Build round data ──────────────────────────────────────────────
            Map<String, Object> round = new LinkedHashMap<>();
            round.put("roundNumber",              roundNumber);
            round.put("attackerHero",             cHero.getTemplate().getDisplayName());
            round.put("attackerLevel",            cHero.getLevel());
            round.put("attackerAttackValue",      Math.round(cAttack * 100.0) / 100.0);
            round.put("defenderHero",             dHero.getTemplate().getDisplayName());
            round.put("defenderLevel",            dHero.getLevel());
            round.put("defenderAttackValue",      Math.round(dAttack * 100.0) / 100.0);
            round.put("attackerStaminaModifier",  Math.round(cStamina * 100.0) / 100.0);
            round.put("defenderStaminaModifier",  Math.round(dStamina * 100.0) / 100.0);
            round.put("attackerPaContrib",        Math.round(cBreak.paContrib()  * 100.0) / 100.0);
            round.put("attackerMpContrib",        Math.round(cBreak.mpContrib()  * 100.0) / 100.0);
            round.put("attackerDexContrib",       Math.round(cBreak.dexContrib() * 100.0) / 100.0);
            round.put("attackerRawAttack",        Math.round(cBreak.rawAttack()  * 100.0) / 100.0);
            if (cBreak.staminaReduction() > 0.001) round.put("attackerStaminaReduction", Math.round(cBreak.staminaReduction() * 100.0) / 100.0);
            if (cBreak.didCrit())                  round.put("attackerCrit", true);
            round.put("attackerStatPa",   Math.round(cStats.getOrDefault("physicalAttack", 0.0) * 100.0) / 100.0);
            round.put("attackerStatMp",   Math.round(cStats.getOrDefault("magicPower",     0.0) * 100.0) / 100.0);
            round.put("attackerStatDex",  Math.round(cStats.getOrDefault("dexterity",      0.0) * 100.0) / 100.0);
            round.put("attackerStatElem", Math.round(cStats.getOrDefault("element",        0.0) * 100.0) / 100.0);
            round.put("attackerStatMana", Math.round(cStats.getOrDefault("mana",           0.0) * 100.0) / 100.0);
            round.put("attackerStatStam", Math.round(cStats.getOrDefault("stamina",        0.0) * 100.0) / 100.0);
            if (cHero.getTemplate().getElement() != null) round.put("attackerElement", cHero.getTemplate().getElement().name());
            round.put("defenderPaContrib",        Math.round(dBreak.paContrib()  * 100.0) / 100.0);
            round.put("defenderMpContrib",        Math.round(dBreak.mpContrib()  * 100.0) / 100.0);
            round.put("defenderDexContrib",       Math.round(dBreak.dexContrib() * 100.0) / 100.0);
            round.put("defenderRawAttack",        Math.round(dBreak.rawAttack()  * 100.0) / 100.0);
            if (dBreak.staminaReduction() > 0.001) round.put("defenderStaminaReduction", Math.round(dBreak.staminaReduction() * 100.0) / 100.0);
            if (dBreak.didCrit())                  round.put("defenderCrit", true);
            round.put("defenderStatPa",   Math.round(dStats.getOrDefault("physicalAttack", 0.0) * 100.0) / 100.0);
            round.put("defenderStatMp",   Math.round(dStats.getOrDefault("magicPower",     0.0) * 100.0) / 100.0);
            round.put("defenderStatDex",  Math.round(dStats.getOrDefault("dexterity",      0.0) * 100.0) / 100.0);
            round.put("defenderStatElem", Math.round(dStats.getOrDefault("element",        0.0) * 100.0) / 100.0);
            round.put("defenderStatMana", Math.round(dStats.getOrDefault("mana",           0.0) * 100.0) / 100.0);
            round.put("defenderStatStam", Math.round(dStats.getOrDefault("stamina",        0.0) * 100.0) / 100.0);
            if (dHero.getTemplate().getElement() != null) round.put("defenderElement", dHero.getTemplate().getElement().name());
            round.put("attackerImagePath", cHero.getTemplate().getImagePath() != null ? cHero.getTemplate().getImagePath() : "");
            round.put("defenderImagePath", dHero.getTemplate().getImagePath() != null ? dHero.getTemplate().getImagePath() : "");
            if (cElemBonus > 0) round.put("attackerElementBonus", Math.round(cElemBonus * 100.0) / 100.0);
            if (dElemBonus > 0) round.put("defenderElementBonus", Math.round(dElemBonus * 100.0) / 100.0);
            if (!cSpells.isEmpty()) round.put("challengerSpells", cSpells);
            if (!dSpells.isEmpty()) round.put("defenderSpells",   dSpells);
            round.put("challengerManaAfter", Math.round(cMana * 10.0) / 10.0);
            round.put("defenderManaAfter",   Math.round(dMana * 10.0) / 10.0);

            // ── Determine winner ──────────────────────────────────────────────
            if (cAttack > dAttack) {
                round.put("winner", "attacker");
                int xp = 4 + 2 * dHero.getLevel();
                challengerXp.merge(cHero.getTemplate().getDisplayName(), xp, Integer::sum);
                cConsecWins++; dConsecWins = 0;
                cHero.setClashesWon(cHero.getClashesWon() + 1);
                cHero.setCurrentWinStreak(cHero.getCurrentWinStreak() + 1);
                cHero.setCurrentLossStreak(0);
                dHero.setClashesLost(dHero.getClashesLost() + 1);
                dHero.setCurrentLossStreak(dHero.getCurrentLossStreak() + 1);
                dHero.setCurrentWinStreak(0);
                if (cAttack > cHero.getMaxDamageDealt())    cHero.setMaxDamageDealt(cAttack);
                if (dAttack > dHero.getMaxDamageDealt())    dHero.setMaxDamageDealt(dAttack);
                if (dAttack > cHero.getMaxDamageReceived()) cHero.setMaxDamageReceived(dAttack);
                if (cAttack > dHero.getMaxDamageReceived()) dHero.setMaxDamageReceived(cAttack);
                dIdx++;
            } else {
                round.put("winner", "defender");
                int xp = 4 + 2 * cHero.getLevel();
                defenderXp.merge(dHero.getTemplate().getDisplayName(), xp, Integer::sum);
                dConsecWins++; cConsecWins = 0;
                dHero.setClashesWon(dHero.getClashesWon() + 1);
                dHero.setCurrentWinStreak(dHero.getCurrentWinStreak() + 1);
                dHero.setCurrentLossStreak(0);
                cHero.setClashesLost(cHero.getClashesLost() + 1);
                cHero.setCurrentLossStreak(cHero.getCurrentLossStreak() + 1);
                cHero.setCurrentWinStreak(0);
                if (dAttack > dHero.getMaxDamageDealt())    dHero.setMaxDamageDealt(dAttack);
                if (cAttack > cHero.getMaxDamageDealt())    cHero.setMaxDamageDealt(cAttack);
                if (cAttack > dHero.getMaxDamageReceived()) dHero.setMaxDamageReceived(cAttack);
                if (dAttack > cHero.getMaxDamageReceived()) cHero.setMaxDamageReceived(dAttack);
                cIdx++;
            }

            rounds.add(round);
        }

        String winner = cIdx < cSlots.size() ? "challenger" : "defender";

        // ── Award XP with Exp Bonus ───────────────────────────────────────────
        for (HeroSlot hs : challengerTeam.heroSlots()) {
            Hero hero = hs.hero();
            int baseXp = challengerXp.getOrDefault(hero.getTemplate().getDisplayName(), 0);
            if (baseXp > 0) {
                double expMult = 1.0 + cHeroExpBonus.getOrDefault(hero.getId(), 0.0);
                hero.setCurrentXp(hero.getCurrentXp() + (int) Math.round(baseXp * expMult));
                checkLevelUp(hero);
            }
            heroRepository.save(hero);
        }
        for (HeroSlot hs : defenderTeam.heroSlots()) {
            Hero hero = hs.hero();
            int baseXp = defenderXp.getOrDefault(hero.getTemplate().getDisplayName(), 0);
            if (baseXp > 0) {
                double expMult = 1.0 + dHeroExpBonus.getOrDefault(hero.getId(), 0.0);
                hero.setCurrentXp(hero.getCurrentXp() + (int) Math.round(baseXp * expMult));
                checkLevelUp(hero);
            }
            heroRepository.save(hero);
        }

        int challengerSummonXp = "challenger".equals(winner) ? 1 : 0;
        int defenderSummonXp   = "defender".equals(winner)   ? 1 : 0;

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

        // ── Build result ──────────────────────────────────────────────────────
        Map<String, Object> result = new LinkedHashMap<>();

        Map<String, Object> challengerInfo = new LinkedHashMap<>();
        challengerInfo.put("username", challengerTeam.username());
        if (challengerTeam.profileImagePath() != null) challengerInfo.put("profileImagePath", challengerTeam.profileImagePath());
        challengerInfo.put("heroes", challengerTeam.heroSlots().stream().map(hs -> {
            Map<String, Object> h = new LinkedHashMap<>();
            h.put("name",      hs.hero().getTemplate().getDisplayName());
            h.put("imagePath", hs.hero().getTemplate().getImagePath() != null ? hs.hero().getTemplate().getImagePath() : "");
            h.put("level",     hs.hero().getLevel());
            if (hs.hero().getTemplate().getElement() != null) h.put("element", hs.hero().getTemplate().getElement().name());
            return h;
        }).toList());
        if (challengerTeam.summon() != null) {
            Map<String, Object> s = new LinkedHashMap<>();
            s.put("name",      challengerTeam.summon().getTemplate().getDisplayName());
            s.put("imagePath", challengerTeam.summon().getTemplate().getImagePath() != null ? challengerTeam.summon().getTemplate().getImagePath() : "");
            challengerInfo.put("summon", s);
        }

        Map<String, Object> defenderInfo = new LinkedHashMap<>();
        defenderInfo.put("username", defenderTeam.username());
        if (defenderTeam.profileImagePath() != null) defenderInfo.put("profileImagePath", defenderTeam.profileImagePath());
        defenderInfo.put("heroes", defenderTeam.heroSlots().stream().map(hs -> {
            Map<String, Object> h = new LinkedHashMap<>();
            h.put("name",      hs.hero().getTemplate().getDisplayName());
            h.put("imagePath", hs.hero().getTemplate().getImagePath() != null ? hs.hero().getTemplate().getImagePath() : "");
            h.put("level",     hs.hero().getLevel());
            if (hs.hero().getTemplate().getElement() != null) h.put("element", hs.hero().getTemplate().getElement().name());
            return h;
        }).toList());
        if (defenderTeam.summon() != null) {
            Map<String, Object> s = new LinkedHashMap<>();
            s.put("name",      defenderTeam.summon().getTemplate().getDisplayName());
            s.put("imagePath", defenderTeam.summon().getTemplate().getImagePath() != null ? defenderTeam.summon().getTemplate().getImagePath() : "");
            defenderInfo.put("summon", s);
        }

        result.put("challenger",             challengerInfo);
        result.put("defender",               defenderInfo);
        result.put("rounds",                 rounds);
        result.put("winner",                 winner);
        result.put("xpGained",               Map.of("challenger", challengerXp, "defender", defenderXp));
        result.put("summonXp",               Map.of("challenger", challengerSummonXp, "defender", defenderSummonXp));
        result.put("challengerManaTotal",    Math.round(cManaTotal * 10.0) / 10.0);
        result.put("defenderManaTotal",      Math.round(dManaTotal * 10.0) / 10.0);
        // Gold Bonus and Item Discovery passed to ArenaService for final gold calculation
        result.put("challengerGoldBonus",    Math.round(cGoldBonus      * 1000.0) / 1000.0);
        result.put("defenderGoldBonus",      Math.round(dGoldBonus      * 1000.0) / 1000.0);
        result.put("challengerItemDiscovery",Math.round(cItemDiscovery  * 1000.0) / 1000.0);
        result.put("defenderItemDiscovery",  Math.round(dItemDiscovery  * 1000.0) / 1000.0);

        return result;
    }

    private Map<String, Double> buildBattleStats(Hero hero, int slotNumber, double summonMpBonus) {
        Map<String, Double> stats = new HashMap<>(PlayerService.buildHeroStats(hero.getTemplate(), hero.getLevel()));

        // ── Base sub-stat defaults (all heroes, before equipment) ─────────────
        stats.put("dexPosture", 0.20);  // 20% of DEX contribution immune to stamina penalty
        stats.put("critDamage", 0.25);  // 0.25 bonus crit multiplier (total: 1.5 + 0.25 = 1.75×)
        // dexProficiency base (0.33) is hardcoded in BattleCalculator

        // ── Equipment bonuses (items) ─────────────────────────────────────────
        for (EquippedItem ei : equippedItemRepository.findByHeroIdAndSlotNumberIsNotNull(hero.getId())) {
            ItemTemplate t = ei.getItemTemplate();
            if (t == null) continue;
            stats.merge("physicalAttack",   t.getBonusPa(),              Double::sum);
            stats.merge("magicPower",       t.getBonusMp(),              Double::sum);
            stats.merge("dexterity",        t.getBonusDex(),             Double::sum);
            stats.merge("element",          t.getBonusElem(),            Double::sum);
            stats.merge("mana",             t.getBonusMana(),            Double::sum);
            stats.merge("stamina",          t.getBonusStam(),            Double::sum);
            // Combat mechanics
            stats.merge("attack",           t.getBonusAttack(),          Double::sum);
            stats.merge("magicProficiency", t.getBonusMagicProficiency(),Double::sum);
            stats.merge("spellMastery",     t.getBonusSpellMastery(),    Double::sum);
            stats.merge("spellActivation",  t.getBonusSpellActivation(), Double::sum);
            stats.merge("dexProficiency",   t.getBonusDexProficiency(),  Double::sum);
            stats.merge("dexPosture",       t.getBonusDexPosture(),      Double::sum);
            stats.merge("critChance",       t.getBonusCritChance(),      Double::sum);
            stats.merge("critDamage",       t.getBonusCritDamage(),      Double::sum);
            stats.merge("expBonus",         t.getBonusExpBonus(),        Double::sum);
            stats.merge("goldBonus",        t.getBonusGoldBonus(),       Double::sum);
            stats.merge("itemDiscovery",    t.getBonusItemDiscovery(),   Double::sum);
            stats.merge("physicalImmunity", t.getBonusPhysicalImmunity(),Double::sum);
            stats.merge("magicImmunity",    t.getBonusMagicImmunity(),   Double::sum);
            stats.merge("dexEvasiveness",   t.getBonusDexEvasiveness(),  Double::sum);
        }

        // ── Equipment bonuses (abilities) ─────────────────────────────────────
        for (EquippedAbility ea : equippedAbilityRepository.findByHeroIdAndSlotNumberIsNotNull(hero.getId())) {
            AbilityTemplate at = ea.getAbilityTemplate();
            if (at == null) continue;
            stats.merge("physicalAttack",   at.getBonusPa(),              Double::sum);
            stats.merge("magicPower",       at.getBonusMp(),              Double::sum);
            stats.merge("dexterity",        at.getBonusDex(),             Double::sum);
            stats.merge("element",          at.getBonusElem(),            Double::sum);
            stats.merge("mana",             at.getBonusMana(),            Double::sum);
            stats.merge("stamina",          at.getBonusStam(),            Double::sum);
            // Combat mechanics
            stats.merge("attack",           at.getBonusAttack(),          Double::sum);
            stats.merge("magicProficiency", at.getBonusMagicProficiency(),Double::sum);
            stats.merge("spellMastery",     at.getBonusSpellMastery(),    Double::sum);
            stats.merge("spellActivation",  at.getBonusSpellActivation(), Double::sum);
            stats.merge("dexProficiency",   at.getBonusDexProficiency(),  Double::sum);
            stats.merge("dexPosture",       at.getBonusDexPosture(),      Double::sum);
            stats.merge("critChance",       at.getBonusCritChance(),      Double::sum);
            stats.merge("critDamage",       at.getBonusCritDamage(),      Double::sum);
            stats.merge("expBonus",         at.getBonusExpBonus(),        Double::sum);
            stats.merge("goldBonus",        at.getBonusGoldBonus(),       Double::sum);
            stats.merge("itemDiscovery",    at.getBonusItemDiscovery(),   Double::sum);
            stats.merge("physicalImmunity", at.getBonusPhysicalImmunity(),Double::sum);
            stats.merge("magicImmunity",    at.getBonusMagicImmunity(),   Double::sum);
            stats.merge("dexEvasiveness",   at.getBonusDexEvasiveness(),  Double::sum);
        }

        if (summonMpBonus > 0) {
            stats.put("magicPower", stats.get("magicPower") + summonMpBonus);
        }

        // ── Off-slot stamina debuff ───────────────────────────────────────────
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
     * Capacity modifier based on consecutive wins and stamina effectiveness.
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

    // ── Weapon spell helpers ──────────────────────────────────────────────────

    private record ActiveBuff(String statKey, double value, int turnsLeft) {}

    /**
     * Apply a weapon spell's bonuses either immediately to stats (pre-clash, instant)
     * or into the active buff list (lasting effects, or any post-clash effect).
     *
     * @param postClash  true = AFTER_CLASH* trigger; effects always go into bufList
     */
    private void applyWeaponSpellBonuses(WeaponSpell ws,
                                         Map<String, Double> immediateStats,
                                         List<ActiveBuff> bufList,
                                         int lastsTurns,
                                         boolean postClash) {
        Map<String, Double> bonuses = getSpellBonusMap(ws);
        if (!postClash && lastsTurns == 0) {
            // Instant: apply to current round only
            bonuses.forEach((k, v) -> { if (v != 0) immediateStats.merge(k, v, Double::sum); });
        } else {
            int turns = postClash ? Math.max(lastsTurns, 1) : lastsTurns;
            bonuses.forEach((k, v) -> { if (v != 0) bufList.add(new ActiveBuff(k, v, turns)); });
            // Also apply to current round for pre-clash lasting spells
            if (!postClash && immediateStats != null) {
                bonuses.forEach((k, v) -> { if (v != 0) immediateStats.merge(k, v, Double::sum); });
            }
        }
    }

    private Map<String, Double> getSpellBonusMap(WeaponSpell ws) {
        Map<String, Double> m = new java.util.LinkedHashMap<>();
        m.put("physicalAttack",   ws.getSpellBonusPa());
        m.put("magicPower",       ws.getSpellBonusMp());
        m.put("dexterity",        ws.getSpellBonusDex());
        m.put("element",          ws.getSpellBonusElem());
        m.put("mana",             ws.getSpellBonusMana());
        m.put("stamina",          ws.getSpellBonusStam());
        m.put("attack",           ws.getSpellBonusAttack());
        m.put("magicProficiency", ws.getSpellBonusMagicProficiency());
        m.put("spellMastery",     ws.getSpellBonusSpellMastery());
        m.put("spellActivation",  ws.getSpellBonusSpellActivation());
        m.put("dexProficiency",   ws.getSpellBonusDexProficiency());
        m.put("dexPosture",       ws.getSpellBonusDexPosture());
        m.put("critChance",       ws.getSpellBonusCritChance());
        m.put("critDamage",       ws.getSpellBonusCritDamage());
        m.put("expBonus",         ws.getSpellBonusExpBonus());
        m.put("goldBonus",        ws.getSpellBonusGoldBonus());
        m.put("itemDiscovery",    ws.getSpellBonusItemDiscovery());
        m.put("physicalImmunity", ws.getSpellBonusPhysicalImmunity());
        m.put("magicImmunity",    ws.getSpellBonusMagicImmunity());
        m.put("dexEvasiveness",   ws.getSpellBonusDexEvasiveness());
        return m;
    }
}
