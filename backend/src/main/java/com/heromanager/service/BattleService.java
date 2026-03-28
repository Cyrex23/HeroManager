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
    private final AbilitySpellRepository abilitySpellRepository;

    public BattleService(TeamSlotRepository teamSlotRepository,
                         HeroRepository heroRepository,
                         SummonRepository summonRepository,
                         EquippedItemRepository equippedItemRepository,
                         EquippedAbilityRepository equippedAbilityRepository,
                         AbilitySpellRepository abilitySpellRepository) {
        this.teamSlotRepository = teamSlotRepository;
        this.heroRepository = heroRepository;
        this.summonRepository = summonRepository;
        this.equippedItemRepository = equippedItemRepository;
        this.equippedAbilityRepository = equippedAbilityRepository;
        this.abilitySpellRepository = abilitySpellRepository;
    }

    public record HeroSlot(Hero hero, int slotNumber) {}
    public record TeamData(List<HeroSlot> heroSlots, Summon summon, Map<String, Double> summonBonuses, String username, String profileImagePath) {}

    public TeamData loadTeam(Long playerId, String username, String profileImagePath) {
        List<TeamSlot> slots = teamSlotRepository.findByPlayerId(playerId);
        slots.sort(Comparator.comparingInt(TeamSlot::getSlotNumber));

        List<HeroSlot> heroSlots = new ArrayList<>();
        Summon summon = null;
        Map<String, Double> summonBonuses = new HashMap<>();

        for (TeamSlot slot : slots) {
            if (slot.getHeroId() != null && slot.getSlotNumber() <= 6) {
                heroRepository.findById(slot.getHeroId())
                        .ifPresent(h -> heroSlots.add(new HeroSlot(h, slot.getSlotNumber())));
            }
            if (slot.getSummonId() != null && slot.getSlotNumber() == 7) {
                summon = summonRepository.findById(slot.getSummonId()).orElse(null);
                if (summon != null) {
                    SummonTemplate st = summon.getTemplate();
                    int lv = summon.getLevel() - 1;
                    summonBonuses.put("magicPower",       st.getBaseMp()                + st.getGrowthMp()                * lv);
                    summonBonuses.put("mana",             st.getBaseMana()              + st.getGrowthMana()              * lv);
                    summonBonuses.put("physicalAttack",   st.getBasePhysicalAttack()    + st.getGrowthPhysicalAttack()    * lv);
                    summonBonuses.put("stamina",          st.getBaseStamina()           + st.getGrowthStamina()           * lv);
                    summonBonuses.put("attack",           st.getBaseAttack()            + st.getGrowthAttack()            * lv);
                    summonBonuses.put("magicProficiency", (st.getBaseMagicProficiency() + st.getGrowthMagicProficiency()  * lv) / 100.0);
                    summonBonuses.put("spellMastery",    (st.getBaseSpellMastery()      + st.getGrowthSpellMastery()      * lv) / 100.0);
                    summonBonuses.put("spellActivation",  (st.getBaseSpellActivation()  + st.getGrowthSpellActivation()   * lv) / 100.0);
                    summonBonuses.put("critChance",       (st.getBaseCritChance()       + st.getGrowthCritChance()        * lv) / 100.0);
                    summonBonuses.put("critDamage",       (st.getBaseCritDamage()       + st.getGrowthCritDamage()        * lv) / 100.0);
                    summonBonuses.put("dexterity",         st.getBaseDex()              + st.getGrowthDex()               * lv);
                    summonBonuses.put("dexProficiency",   (st.getBaseDexProficiency()   + st.getGrowthDexProficiency()    * lv) / 100.0);
                    summonBonuses.put("dexPosture",       (st.getBaseDexPosture()       + st.getGrowthDexPosture()        * lv) / 100.0);
                    summonBonuses.put("expBonus",         (st.getBaseXpBonus()          + st.getGrowthXpBonus()           * lv) / 100.0);
                    summonBonuses.put("goldBonus",        (st.getBaseGoldBonus()        + st.getGrowthGoldBonus()         * lv) / 100.0);
                    summonBonuses.put("itemDiscovery",     st.getBaseItemFind()         + st.getGrowthItemFind()          * lv);
                    summonBonuses.put("physicalImmunity", (st.getBasePhysicalImmunity() + st.getGrowthPhysicalImmunity() * lv) / 100.0);
                    summonBonuses.put("magicImmunity",    (st.getBaseMagicImmunity()    + st.getGrowthMagicImmunity()    * lv) / 100.0);
                    summonBonuses.put("dexEvasiveness",   (st.getBaseDexEvasiveness()   + st.getGrowthDexEvasiveness()   * lv) / 100.0);
                    summonBonuses.put("manaRecharge",     (st.getBaseManaRecharge()     + st.getGrowthManaRecharge()     * lv) / 100.0);
                    summonBonuses.put("spellLearn",       (st.getBaseSpellLearn()       + st.getGrowthSpellLearn()       * lv) / 100.0);
                    summonBonuses.put("spellCopy",        (st.getBaseSpellCopy()        + st.getGrowthSpellCopy()        * lv) / 100.0);
                    summonBonuses.put("spellAbsorb",      (st.getBaseSpellAbsorb()      + st.getGrowthSpellAbsorb()      * lv) / 100.0);
                    summonBonuses.put("rot",              (st.getBaseRot()              + st.getGrowthRot()              * lv) / 100.0);
                }
            }
        }

        return new TeamData(heroSlots, summon, summonBonuses, username, profileImagePath);
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
            Map<String, Double> s = buildBattleStats(hs.hero(), hs.slotNumber(), challengerTeam.summonBonuses());
            cManaTotal       += s.getOrDefault("mana",          0.0);
            cGoldBonus       += s.getOrDefault("goldBonus",     0.0);
            cItemDiscovery   += s.getOrDefault("itemDiscovery", 0.0);
            cHeroExpBonus.put(hs.hero().getId(), s.getOrDefault("expBonus", 0.0));
        }
        for (HeroSlot hs : dSlots) {
            Map<String, Double> s = buildBattleStats(hs.hero(), hs.slotNumber(), defenderTeam.summonBonuses());
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
        List<ActiveBuff> cNextHeroBufs = new ArrayList<>(); // NEXT pass-on: consumed after next hero change
        List<ActiveBuff> dNextHeroBufs = new ArrayList<>();
        List<ActiveBuff> cTeamBufs     = new ArrayList<>(); // TEAM pass-on: persist for all subsequent heroes
        List<ActiveBuff> dTeamBufs     = new ArrayList<>();
        int cHeroTurn = 0, dHeroTurn = 0;
        int prevCIdx = -1, prevDIdx = -1;
        // Track remaining DEX per hero (consumed each round, partially recovered via dexPosture)
        Map<Long, Double> cHeroDex = new HashMap<>();
        Map<Long, Double> dHeroDex = new HashMap<>();

        // ── Spell Learn: pool of learned spells per hero (cleared on hero death) ─
        Map<Long, List<SpellSnapshot>> cLearnedSpells = new HashMap<>();
        Map<Long, List<SpellSnapshot>> dLearnedSpells = new HashMap<>();

        // ── Rot state: immunity reduction applied to each hero over turns ────────
        Map<Long, RotState> cHeroRot = new HashMap<>();  // rot afflicting challenger heroes
        Map<Long, RotState> dHeroRot = new HashMap<>();  // rot afflicting defender heroes

        while (cIdx < cSlots.size() && dIdx < dSlots.size()) {
            roundNumber++;
            HeroSlot cSlot = cSlots.get(cIdx);
            HeroSlot dSlot = dSlots.get(dIdx);
            Hero cHero = cSlot.hero();
            Hero dHero = dSlot.hero();

            Map<String, Double> cStats = buildBattleStats(cHero, cSlot.slotNumber(), challengerTeam.summonBonuses());
            Map<String, Double> dStats = buildBattleStats(dHero, dSlot.slotNumber(), defenderTeam.summonBonuses());

            // ── Hero turn tracking (reset on hero change) ─────────────────────
            if (cIdx != prevCIdx) {
                cHeroTurn = 0; cWsUsages = new HashMap<>(); cLearnedSpells.remove(cIdx > 0 ? cSlots.get(cIdx - 1).hero().getId() : -1L); prevCIdx = cIdx;
                // Apply pass-on buffs to the new challenger hero's stats
                cNextHeroBufs.forEach(buf -> cStats.merge(buf.statKey(), buf.value(), Double::sum));
                cTeamBufs.forEach(buf -> cStats.merge(buf.statKey(), buf.value(), Double::sum));
                cNextHeroBufs.clear();
            }
            if (dIdx != prevDIdx) {
                dHeroTurn = 0; dWsUsages = new HashMap<>(); dLearnedSpells.remove(dIdx > 0 ? dSlots.get(dIdx - 1).hero().getId() : -1L); prevDIdx = dIdx;
                // Apply pass-on buffs to the new defender hero's stats
                dNextHeroBufs.forEach(buf -> dStats.merge(buf.statKey(), buf.value(), Double::sum));
                dTeamBufs.forEach(buf -> dStats.merge(buf.statKey(), buf.value(), Double::sum));
                dNextHeroBufs.clear();
            }
            cHeroTurn++; dHeroTurn++;

            // ── Apply & tick persistent weapon-spell buffs/debuffs ────────────
            for (ActiveBuff b : cBufList) cStats.merge(b.statKey(), b.value(), Double::sum);
            for (ActiveBuff b : dBufList) dStats.merge(b.statKey(), b.value(), Double::sum);
            cBufList.replaceAll(b -> new ActiveBuff(b.statKey(), b.value(), b.turnsLeft() - 1));
            dBufList.replaceAll(b -> new ActiveBuff(b.statKey(), b.value(), b.turnsLeft() - 1));
            cBufList.removeIf(b -> b.turnsLeft() <= 0);
            dBufList.removeIf(b -> b.turnsLeft() <= 0);

            // ── Cleanse: chance to remove all active conditions ──────────────
            double cCleanse = cStats.getOrDefault("cleanse", 0.0);
            double dCleanse = dStats.getOrDefault("cleanse", 0.0);
            boolean cCleansed = false, dCleansed = false;
            if (cCleanse > 0 && cHeroRot.getOrDefault(cHero.getId(), new RotState(0,1,0,0)).remainingTurns() > 0) {
                if (random.nextDouble() < cCleanse) { cHeroRot.remove(cHero.getId()); cCleansed = true; }
            }
            if (dCleanse > 0 && dHeroRot.getOrDefault(dHero.getId(), new RotState(0,1,0,0)).remainingTurns() > 0) {
                if (random.nextDouble() < dCleanse) { dHeroRot.remove(dHero.getId()); dCleansed = true; }
            }

            // ── Apply Rot: reduce immunities on affected heroes ───────────────
            RotState cRotState = cHeroRot.get(cHero.getId());
            RotState dRotState = dHeroRot.get(dHero.getId());
            double cRotReduction = 0.0, dRotReduction = 0.0;
            if (cRotState != null && cRotState.remainingTurns() > 0) {
                cRotReduction = (cRotState.maxReduction() + cRotState.stackBonus()) * cRotState.remainingTurns() / (double) cRotState.totalTurns();
                // Multiplicative: rot removes X% of the hero's existing immunity (e.g. 10% imm × (1-0.33) = 6.67% imm)
                for (String key : List.of("physicalImmunity", "magicImmunity", "dexEvasiveness"))
                    cStats.put(key, cStats.getOrDefault(key, 0.0) * (1.0 - cRotReduction));
            }
            if (dRotState != null && dRotState.remainingTurns() > 0) {
                dRotReduction = (dRotState.maxReduction() + dRotState.stackBonus()) * dRotState.remainingTurns() / (double) dRotState.totalTurns();
                for (String key : List.of("physicalImmunity", "magicImmunity", "dexEvasiveness"))
                    dStats.put(key, dStats.getOrDefault(key, 0.0) * (1.0 - dRotReduction));
            }

            // ── Spell resolution ──────────────────────────────────────────────
            double cSpellMastery    = cStats.getOrDefault("spellMastery",    0.0);
            double cSpellActivation = cStats.getOrDefault("spellActivation", 0.0);
            double dSpellMastery    = dStats.getOrDefault("spellMastery",    0.0);
            double dSpellActivation = dStats.getOrDefault("spellActivation", 0.0);
            double cSpellLearn      = challengerTeam.summonBonuses().getOrDefault("spellLearn",  0.0);
            double cSpellCopy       = challengerTeam.summonBonuses().getOrDefault("spellCopy",   0.0);
            double cSpellAbsorb     = challengerTeam.summonBonuses().getOrDefault("spellAbsorb", 0.0);
            double dSpellLearn      = defenderTeam.summonBonuses().getOrDefault("spellLearn",    0.0);
            double dSpellCopy       = defenderTeam.summonBonuses().getOrDefault("spellCopy",     0.0);
            double dSpellAbsorb     = defenderTeam.summonBonuses().getOrDefault("spellAbsorb",   0.0);

            boolean cIsNew = !cEntranceFired.contains(cHero.getId());
            boolean dIsNew = !dEntranceFired.contains(dHero.getId());

            // Tracks ability spells that actually fired (not absorbed) — for learn/copy reactions
            List<SpellSnapshot> cFiredAbilitySnaps = new ArrayList<>();
            List<SpellSnapshot> dFiredAbilitySnaps = new ArrayList<>();

            // Sets of spell names each hero already owns — cannot learn/copy own spells
            Set<String> cOwnSpells = new HashSet<>();
            for (EquippedAbility ea : equippedAbilityRepository.findByHeroIdAndSlotNumberIsNotNull(cHero.getId())) {
                AbilityTemplate _at = ea.getAbilityTemplate();
                if (_at != null && _at.getSpellName() != null) cOwnSpells.add(_at.getSpellName());
            }
            for (EquippedItem ei : equippedItemRepository.findByHeroIdAndSlotNumberIsNotNull(cHero.getId())) {
                ItemTemplate _it = ei.getItemTemplate();
                if (_it != null) _it.getSpells().forEach(ws -> { if (ws.getSpellName() != null) cOwnSpells.add(ws.getSpellName()); });
            }
            Set<String> dOwnSpells = new HashSet<>();
            for (EquippedAbility ea : equippedAbilityRepository.findByHeroIdAndSlotNumberIsNotNull(dHero.getId())) {
                AbilityTemplate _at = ea.getAbilityTemplate();
                if (_at != null && _at.getSpellName() != null) dOwnSpells.add(_at.getSpellName());
            }
            for (EquippedItem ei : equippedItemRepository.findByHeroIdAndSlotNumberIsNotNull(dHero.getId())) {
                ItemTemplate _it = ei.getItemTemplate();
                if (_it != null) _it.getSpells().forEach(ws -> { if (ws.getSpellName() != null) dOwnSpells.add(ws.getSpellName()); });
            }

            List<Map<String, Object>> cSpells = new ArrayList<>();

            // ── Fire challenger's learned spells ──────────────────────────────
            for (SpellSnapshot snap : cLearnedSpells.getOrDefault(cHero.getId(), Collections.emptyList())) {
                if (cMana < snap.manaCost()) continue;
                Map<String, Object> ev = new LinkedHashMap<>();
                ev.put("spellName", snap.spellName()); ev.put("heroName", cHero.getTemplate().getDisplayName());
                ev.put("trigger", snap.trigger() != null ? snap.trigger() : "ATTACK");
                ev.put("chance", snap.chance()); ev.put("fired", true); ev.put("fromLearned", true);
                Map<String, Object> cFlBonuses = getSnapBonusMap(snap); if (!cFlBonuses.isEmpty()) ev.put("bonuses", cFlBonuses);
                cMana -= snap.manaCost(); ev.put("manaCost", Math.round(snap.manaCost() * 10.0) / 10.0);
                boolean absorbedByD = dSpellAbsorb > 0 && random.nextDouble() < dSpellAbsorb;
                if (absorbedByD) {
                    ev.put("absorbed", true);
                    dMana = Math.min(dMana + snap.manaCost(), dManaTotal);
                } else {
                    if (snap.bonusPa()   != 0) cStats.merge("physicalAttack", snap.bonusPa(),   Double::sum);
                    if (snap.bonusMp()   != 0) cStats.merge("magicPower",     snap.bonusMp(),   Double::sum);
                    if (snap.bonusDex()  != 0) cStats.merge("dexterity",      snap.bonusDex(),  Double::sum);
                    if (snap.bonusElem() != 0) cStats.merge("element",        snap.bonusElem(), Double::sum);
                    if (snap.bonusMana() != 0) cStats.merge("mana",           snap.bonusMana(), Double::sum);
                    if (snap.bonusStam() != 0) cStats.merge("stamina",        snap.bonusStam(), Double::sum);
                }
                cSpells.add(ev);
            }

            // ── Challenger's own ability spells ───────────────────────────────
            boolean dIsRotted = dHeroRot.getOrDefault(dHero.getId(), new RotState(0,1,0,0)).remainingTurns() > 0;
            boolean cIsRotted = cHeroRot.getOrDefault(cHero.getId(), new RotState(0,1,0,0)).remainingTurns() > 0;
            for (EquippedAbility ea : equippedAbilityRepository.findByHeroIdAndSlotNumberIsNotNull(cHero.getId())) {
                AbilityTemplate at = ea.getAbilityTemplate();
                if (at == null) continue;
                for (AbilitySpell asp : abilitySpellRepository.findByAbilityTemplateId(at.getId())) {
                    if (asp.getSpellTrigger() == null) continue;
                    boolean fires = switch (asp.getSpellTrigger()) {
                        case "ENTRANCE"          -> cIsNew;
                        case "OPPONENT_ENTRANCE" -> cIsNew || dIsNew;
                        case "ATTACK"            -> true;
                        case "ATTACK_IF_ROTTED"  -> dIsRotted;
                        default -> false;
                    };
                    if (!fires || cMana < asp.getSpellManaCost()) continue;
                    String aspKey = "as-" + asp.getId();
                    if (asp.getMaxUsages() > 0 && cWsUsages.getOrDefault(aspKey, 0) >= asp.getMaxUsages()) continue;
                    double rawChance = asp.getSpellChance() + cSpellActivation;
                    double effectiveChance = Math.min(1.0, rawChance);
                    boolean fired = random.nextDouble() < effectiveChance;
                    int cOverflowLevels = 0;
                    if (fired && rawChance > 1.0) {
                        double overflow = rawChance - 1.0;
                        cOverflowLevels = (int) Math.floor(overflow);
                        double fractional = overflow - cOverflowLevels;
                        if (fractional > 0 && random.nextDouble() < fractional) cOverflowLevels++;
                    }
                    double cOverflowMult = 1.0 + 0.6 * cOverflowLevels;
                    Map<String, Object> ev = new LinkedHashMap<>();
                    ev.put("spellName", asp.getSpellName()); ev.put("heroName", cHero.getTemplate().getDisplayName());
                    ev.put("trigger", asp.getSpellTrigger()); ev.put("chance", Math.round(effectiveChance * 1000.0) / 10.0);
                    ev.put("fired", fired);
                    if (asp.getPassOnType() != null) ev.put("passOn", asp.getPassOnType());
                    Map<String, Object> aspBonuses = getAbilitySpellBonusMap(asp);
                    if (!aspBonuses.isEmpty()) ev.put("bonuses", aspBonuses);
                    if (asp.getLastsTurns() > 0) ev.put("lastsTurns", asp.getLastsTurns());
                    if (asp.isAffectsOpponent()) ev.put("affectsOpponent", true);
                    if (!fired) { cSpells.add(ev); continue; }
                    double cEffectiveCost = Math.max(0.0, asp.getSpellManaCost() * (1.0 - cSpellMastery));
                    cMana -= cEffectiveCost; ev.put("manaCost", Math.round(cEffectiveCost * 10.0) / 10.0);
                    if (cSpellMastery > 0) ev.put("originalManaCost", asp.getSpellManaCost());
                    cWsUsages.merge(aspKey, 1, Integer::sum);
                    boolean absorbedByD = !asp.isAffectsOpponent() && dSpellAbsorb > 0 && random.nextDouble() < dSpellAbsorb;
                    if (absorbedByD) {
                        ev.put("absorbed", true); dMana = Math.min(dMana + cEffectiveCost, dManaTotal);
                    } else {
                        double masteryMult = (at.getTier() == 3 && cSpellMastery > 0) ? (1.0 + cSpellMastery) : 1.0;
                        double finalMult = cOverflowMult * masteryMult;
                        if (asp.isAffectsOpponent()) {
                            applyAbilitySpellBonuses(asp, dStats, dBufList, asp.getLastsTurns(), finalMult);
                        } else if (asp.getPassOnType() != null) {
                            // Sub spell: buffs only subsequent team heroes, NOT the caster
                            applyAbilityPassOnBonuses(asp, cNextHeroBufs, cTeamBufs, finalMult);
                            if ("BATTLEFIELD".equals(asp.getPassOnType())) applyAbilityPassOnBonuses(asp, dNextHeroBufs, dTeamBufs, finalMult);
                        } else {
                            applyAbilitySpellBonuses(asp, cStats, cBufList, asp.getLastsTurns(), finalMult);
                        }
                        if (cOverflowLevels > 0) ev.put("overflowMult", Math.round(cOverflowMult * 100.0) / 100.0);
                        cFiredAbilitySnaps.add(new SpellSnapshot(asp.getSpellName(), cEffectiveCost,
                                asp.getSpellBonusPa(), asp.getSpellBonusMp(), asp.getSpellBonusDex(),
                                asp.getSpellBonusElem(), asp.getSpellBonusMana(), asp.getSpellBonusStam(),
                                asp.getSpellTrigger(), Math.round(effectiveChance * 1000.0) / 10.0));
                    }
                    cSpells.add(ev);
                }
            }
            // ── Weapon spells pre-clash (challenger) ──────────────────────────
            for (EquippedItem ei : equippedItemRepository.findByHeroIdAndSlotNumberIsNotNull(cHero.getId())) {
                ItemTemplate it = ei.getItemTemplate();
                if (it == null) continue;
                for (WeaponSpell ws : it.getSpells()) {
                    if (ws.getSpellTrigger() == null) continue;
                    String wsTrig = ws.getSpellTrigger();
                    if (wsTrig.startsWith("AFTER_CLASH")) continue;
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
                    double wsChanceC = Math.min(1.0, ws.getSpellChance() + cSpellActivation);
                    boolean wsFiredC = random.nextDouble() < wsChanceC;
                    Map<String, Object> ev = new LinkedHashMap<>();
                    ev.put("spellName", ws.getSpellName()); ev.put("heroName", cHero.getTemplate().getDisplayName());
                    ev.put("trigger", wsTrig); ev.put("chance", Math.round(wsChanceC * 1000.0) / 10.0); ev.put("fired", wsFiredC);
                    Map<String, Object> cWsBonuses = new LinkedHashMap<>(); getSpellBonusMap(ws).forEach((k, v) -> { if (v != 0) cWsBonuses.put(k, v); });
                    if (!cWsBonuses.isEmpty()) ev.put("bonuses", cWsBonuses);
                    if (ws.getLastsTurns() > 0) ev.put("lastsTurns", ws.getLastsTurns());
                    if (!wsFiredC) { cSpells.add(ev); continue; }
                    cMana -= ws.getSpellManaCost(); cWsUsages.merge(wsKey, 1, Integer::sum);
                    boolean wAbsorbedByD = dSpellAbsorb > 0 && random.nextDouble() < dSpellAbsorb;
                    if (wAbsorbedByD) {
                        ev.put("absorbed", true);
                        dMana = Math.min(dMana + ws.getSpellManaCost(), dManaTotal);
                    } else {
                        Map<String, Double> target = ws.isAffectsOpponent() ? dStats : cStats;
                        List<ActiveBuff> targetBufs = ws.isAffectsOpponent() ? dBufList : cBufList;
                        applyWeaponSpellBonuses(ws, target, targetBufs, ws.getLastsTurns(), false);
                        if (ws.isAffectsOpponent()) ev.put("affectsOpponent", true);
                    }
                    ev.put("manaCost", ws.getSpellManaCost());
                    cSpells.add(ev);
                }
            }
            cEntranceFired.add(cHero.getId());

            List<Map<String, Object>> dSpells = new ArrayList<>();

            // ── Fire defender's learned spells ────────────────────────────────
            for (SpellSnapshot snap : dLearnedSpells.getOrDefault(dHero.getId(), Collections.emptyList())) {
                if (dMana < snap.manaCost()) continue;
                Map<String, Object> ev = new LinkedHashMap<>();
                ev.put("spellName", snap.spellName()); ev.put("heroName", dHero.getTemplate().getDisplayName());
                ev.put("trigger", snap.trigger() != null ? snap.trigger() : "ATTACK");
                ev.put("chance", snap.chance()); ev.put("fired", true); ev.put("fromLearned", true);
                Map<String, Object> dFlBonuses = getSnapBonusMap(snap); if (!dFlBonuses.isEmpty()) ev.put("bonuses", dFlBonuses);
                dMana -= snap.manaCost(); ev.put("manaCost", Math.round(snap.manaCost() * 10.0) / 10.0);
                boolean absorbedByC = cSpellAbsorb > 0 && random.nextDouble() < cSpellAbsorb;
                if (absorbedByC) {
                    ev.put("absorbed", true);
                    cMana = Math.min(cMana + snap.manaCost(), cManaTotal);
                } else {
                    if (snap.bonusPa()   != 0) dStats.merge("physicalAttack", snap.bonusPa(),   Double::sum);
                    if (snap.bonusMp()   != 0) dStats.merge("magicPower",     snap.bonusMp(),   Double::sum);
                    if (snap.bonusDex()  != 0) dStats.merge("dexterity",      snap.bonusDex(),  Double::sum);
                    if (snap.bonusElem() != 0) dStats.merge("element",        snap.bonusElem(), Double::sum);
                    if (snap.bonusMana() != 0) dStats.merge("mana",           snap.bonusMana(), Double::sum);
                    if (snap.bonusStam() != 0) dStats.merge("stamina",        snap.bonusStam(), Double::sum);
                }
                dSpells.add(ev);
            }

            // ── Defender's own ability spells ─────────────────────────────────
            for (EquippedAbility ea : equippedAbilityRepository.findByHeroIdAndSlotNumberIsNotNull(dHero.getId())) {
                AbilityTemplate at = ea.getAbilityTemplate();
                if (at == null) continue;
                for (AbilitySpell asp : abilitySpellRepository.findByAbilityTemplateId(at.getId())) {
                    if (asp.getSpellTrigger() == null) continue;
                    boolean fires = switch (asp.getSpellTrigger()) {
                        case "ENTRANCE"          -> dIsNew;
                        case "OPPONENT_ENTRANCE" -> dIsNew || cIsNew;
                        case "ATTACK"            -> true;
                        case "ATTACK_IF_ROTTED"  -> cIsRotted;
                        default -> false;
                    };
                    if (!fires || dMana < asp.getSpellManaCost()) continue;
                    String aspKey = "as-" + asp.getId();
                    if (asp.getMaxUsages() > 0 && dWsUsages.getOrDefault(aspKey, 0) >= asp.getMaxUsages()) continue;
                    double rawChance = asp.getSpellChance() + dSpellActivation;
                    double effectiveChance = Math.min(1.0, rawChance);
                    boolean fired = random.nextDouble() < effectiveChance;
                    int dOverflowLevels = 0;
                    if (fired && rawChance > 1.0) {
                        double overflow = rawChance - 1.0;
                        dOverflowLevels = (int) Math.floor(overflow);
                        double fractional = overflow - dOverflowLevels;
                        if (fractional > 0 && random.nextDouble() < fractional) dOverflowLevels++;
                    }
                    double dOverflowMult = 1.0 + 0.6 * dOverflowLevels;
                    Map<String, Object> ev = new LinkedHashMap<>();
                    ev.put("spellName", asp.getSpellName()); ev.put("heroName", dHero.getTemplate().getDisplayName());
                    ev.put("trigger", asp.getSpellTrigger()); ev.put("chance", Math.round(effectiveChance * 1000.0) / 10.0);
                    ev.put("fired", fired);
                    if (asp.getPassOnType() != null) ev.put("passOn", asp.getPassOnType());
                    Map<String, Object> aspBonuses = getAbilitySpellBonusMap(asp);
                    if (!aspBonuses.isEmpty()) ev.put("bonuses", aspBonuses);
                    if (asp.getLastsTurns() > 0) ev.put("lastsTurns", asp.getLastsTurns());
                    if (asp.isAffectsOpponent()) ev.put("affectsOpponent", true);
                    if (!fired) { dSpells.add(ev); continue; }
                    double dEffectiveCost = Math.max(0.0, asp.getSpellManaCost() * (1.0 - dSpellMastery));
                    dMana -= dEffectiveCost; ev.put("manaCost", Math.round(dEffectiveCost * 10.0) / 10.0);
                    if (dSpellMastery > 0) ev.put("originalManaCost", asp.getSpellManaCost());
                    dWsUsages.merge(aspKey, 1, Integer::sum);
                    boolean absorbedByC = !asp.isAffectsOpponent() && cSpellAbsorb > 0 && random.nextDouble() < cSpellAbsorb;
                    if (absorbedByC) {
                        ev.put("absorbed", true); cMana = Math.min(cMana + dEffectiveCost, cManaTotal);
                    } else {
                        double masteryMult = (at.getTier() == 3 && dSpellMastery > 0) ? (1.0 + dSpellMastery) : 1.0;
                        double finalMult = dOverflowMult * masteryMult;
                        if (asp.isAffectsOpponent()) {
                            applyAbilitySpellBonuses(asp, cStats, cBufList, asp.getLastsTurns(), finalMult);
                        } else if (asp.getPassOnType() != null) {
                            // Sub spell: buffs only subsequent team heroes, NOT the caster
                            applyAbilityPassOnBonuses(asp, dNextHeroBufs, dTeamBufs, finalMult);
                            if ("BATTLEFIELD".equals(asp.getPassOnType())) applyAbilityPassOnBonuses(asp, cNextHeroBufs, cTeamBufs, finalMult);
                        } else {
                            applyAbilitySpellBonuses(asp, dStats, dBufList, asp.getLastsTurns(), finalMult);
                        }
                        if (dOverflowLevels > 0) ev.put("overflowMult", Math.round(dOverflowMult * 100.0) / 100.0);
                        dFiredAbilitySnaps.add(new SpellSnapshot(asp.getSpellName(), dEffectiveCost,
                                asp.getSpellBonusPa(), asp.getSpellBonusMp(), asp.getSpellBonusDex(),
                                asp.getSpellBonusElem(), asp.getSpellBonusMana(), asp.getSpellBonusStam(),
                                asp.getSpellTrigger(), Math.round(effectiveChance * 1000.0) / 10.0));
                    }
                    dSpells.add(ev);
                }
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
                    double wsChanceD = Math.min(1.0, ws.getSpellChance() + dSpellActivation);
                    boolean wsFiredD = random.nextDouble() < wsChanceD;
                    Map<String, Object> ev = new LinkedHashMap<>();
                    ev.put("spellName", ws.getSpellName()); ev.put("heroName", dHero.getTemplate().getDisplayName());
                    ev.put("trigger", wsTrig); ev.put("chance", Math.round(wsChanceD * 1000.0) / 10.0); ev.put("fired", wsFiredD);
                    Map<String, Object> dWsBonuses = new LinkedHashMap<>(); getSpellBonusMap(ws).forEach((k, v) -> { if (v != 0) dWsBonuses.put(k, v); });
                    if (!dWsBonuses.isEmpty()) ev.put("bonuses", dWsBonuses);
                    if (ws.getLastsTurns() > 0) ev.put("lastsTurns", ws.getLastsTurns());
                    if (!wsFiredD) { dSpells.add(ev); continue; }
                    dMana -= ws.getSpellManaCost(); dWsUsages.merge(wsKey, 1, Integer::sum);
                    boolean wAbsorbedByC = cSpellAbsorb > 0 && random.nextDouble() < cSpellAbsorb;
                    if (wAbsorbedByC) {
                        ev.put("absorbed", true);
                        cMana = Math.min(cMana + ws.getSpellManaCost(), cManaTotal);
                    } else {
                        Map<String, Double> target = ws.isAffectsOpponent() ? cStats : dStats;
                        List<ActiveBuff> targetBufs = ws.isAffectsOpponent() ? cBufList : dBufList;
                        applyWeaponSpellBonuses(ws, target, targetBufs, ws.getLastsTurns(), false);
                        if (ws.isAffectsOpponent()) ev.put("affectsOpponent", true);
                    }
                    ev.put("manaCost", ws.getSpellManaCost());
                    dSpells.add(ev);
                }
            }
            dEntranceFired.add(dHero.getId());

            // ── Spell Learn & Copy reactions ──────────────────────────────────
            // Challenger reacts to defender's fired spells
            for (SpellSnapshot snap : dFiredAbilitySnaps) {
                if (cOwnSpells.contains(snap.spellName())) continue; // skip — hero already has this spell
                if (cSpellLearn > 0 && random.nextDouble() < cSpellLearn) {
                    List<SpellSnapshot> pool = cLearnedSpells.computeIfAbsent(cHero.getId(), k -> new ArrayList<>());
                    if (pool.stream().noneMatch(s -> s.spellName().equals(snap.spellName()))) {
                        pool.add(snap);
                        Map<String, Object> lev = new LinkedHashMap<>();
                        lev.put("spellName", snap.spellName()); lev.put("heroName", cHero.getTemplate().getDisplayName());
                        Map<String, Object> cLevBonuses = getSnapBonusMap(snap); if (!cLevBonuses.isEmpty()) lev.put("bonuses", cLevBonuses);
                        if (snap.trigger() != null) lev.put("trigger", snap.trigger());
                        lev.put("chance", snap.chance()); lev.put("fired", false); lev.put("justLearned", true);
                        cSpells.add(lev);
                    }
                }
                if (cSpellCopy > 0 && random.nextDouble() < cSpellCopy) {
                    if (snap.bonusPa()   != 0) cStats.merge("physicalAttack", snap.bonusPa(),   Double::sum);
                    if (snap.bonusMp()   != 0) cStats.merge("magicPower",     snap.bonusMp(),   Double::sum);
                    if (snap.bonusDex()  != 0) cStats.merge("dexterity",      snap.bonusDex(),  Double::sum);
                    if (snap.bonusElem() != 0) cStats.merge("element",        snap.bonusElem(), Double::sum);
                    if (snap.bonusMana() != 0) cStats.merge("mana",           snap.bonusMana(), Double::sum);
                    if (snap.bonusStam() != 0) cStats.merge("stamina",        snap.bonusStam(), Double::sum);
                    Map<String, Object> cev = new LinkedHashMap<>();
                    cev.put("spellName", snap.spellName()); cev.put("heroName", cHero.getTemplate().getDisplayName());
                    if (snap.trigger() != null) cev.put("trigger", snap.trigger());
                    cev.put("chance", snap.chance()); cev.put("fired", true); cev.put("copied", true); cev.put("manaCost", 0.0);
                    Map<String, Object> cCopyBonuses = getSnapBonusMap(snap); if (!cCopyBonuses.isEmpty()) cev.put("bonuses", cCopyBonuses);
                    cSpells.add(cev);
                }
            }
            // Defender reacts to challenger's fired spells
            for (SpellSnapshot snap : cFiredAbilitySnaps) {
                if (dOwnSpells.contains(snap.spellName())) continue; // skip — hero already has this spell
                if (dSpellLearn > 0 && random.nextDouble() < dSpellLearn) {
                    List<SpellSnapshot> pool = dLearnedSpells.computeIfAbsent(dHero.getId(), k -> new ArrayList<>());
                    if (pool.stream().noneMatch(s -> s.spellName().equals(snap.spellName()))) {
                        pool.add(snap);
                        Map<String, Object> lev = new LinkedHashMap<>();
                        lev.put("spellName", snap.spellName()); lev.put("heroName", dHero.getTemplate().getDisplayName());
                        Map<String, Object> dLevBonuses = getSnapBonusMap(snap); if (!dLevBonuses.isEmpty()) lev.put("bonuses", dLevBonuses);
                        if (snap.trigger() != null) lev.put("trigger", snap.trigger());
                        lev.put("chance", snap.chance()); lev.put("fired", false); lev.put("justLearned", true);
                        dSpells.add(lev);
                    }
                }
                if (dSpellCopy > 0 && random.nextDouble() < dSpellCopy) {
                    if (snap.bonusPa()   != 0) dStats.merge("physicalAttack", snap.bonusPa(),   Double::sum);
                    if (snap.bonusMp()   != 0) dStats.merge("magicPower",     snap.bonusMp(),   Double::sum);
                    if (snap.bonusDex()  != 0) dStats.merge("dexterity",      snap.bonusDex(),  Double::sum);
                    if (snap.bonusElem() != 0) dStats.merge("element",        snap.bonusElem(), Double::sum);
                    if (snap.bonusMana() != 0) dStats.merge("mana",           snap.bonusMana(), Double::sum);
                    if (snap.bonusStam() != 0) dStats.merge("stamina",        snap.bonusStam(), Double::sum);
                    Map<String, Object> dev = new LinkedHashMap<>();
                    dev.put("spellName", snap.spellName()); dev.put("heroName", dHero.getTemplate().getDisplayName());
                    if (snap.trigger() != null) dev.put("trigger", snap.trigger());
                    dev.put("chance", snap.chance()); dev.put("fired", true); dev.put("copied", true); dev.put("manaCost", 0.0);
                    Map<String, Object> dCopyBonuses = getSnapBonusMap(snap); if (!dCopyBonuses.isEmpty()) dev.put("bonuses", dCopyBonuses);
                    dSpells.add(dev);
                }
            }

            // ── DEX persistence: apply tracked current DEX (consumed & recovered each round) ──
            double cCurrentDex = cHeroDex.getOrDefault(cHero.getId(), cStats.getOrDefault("dexterity", 0.0));
            double dCurrentDex = dHeroDex.getOrDefault(dHero.getId(), dStats.getOrDefault("dexterity", 0.0));
            cStats.put("dexterity", cCurrentDex);
            dStats.put("dexterity", dCurrentDex);

            // ── Stamina effectiveness ─────────────────────────────────────────
            double cStaminaEff = Math.min(1.0, cStats.getOrDefault("stamina", 0.0) / (60.0 + cHero.getLevel() * 2.5));
            double dStaminaEff = Math.min(1.0, dStats.getOrDefault("stamina", 0.0) / (60.0 + dHero.getLevel() * 2.5));
            double cStamina = getTurnCapacity(cConsecWins, cStaminaEff);
            double dStamina = getTurnCapacity(dConsecWins, dStaminaEff);

            // ── Tenacity: reduce consecutive-win penalty ──────────────────────
            double cTenacity = cStats.getOrDefault("tenacity", 0.0);
            double dTenacity = dStats.getOrDefault("tenacity", 0.0);
            double cStaminaRaw = cStamina;
            double dStaminaRaw = dStamina;
            if (cTenacity > 0 && cConsecWins > 0 && cStamina < 1.0) {
                double effTen = effectiveTenacity(cTenacity);
                double reducedPenalty = (1.0 - cStamina) * 200.0 / (200.0 + effTen);
                cStamina = 1.0 - reducedPenalty;
            }
            if (dTenacity > 0 && dConsecWins > 0 && dStamina < 1.0) {
                double effTen = effectiveTenacity(dTenacity);
                double reducedPenalty = (1.0 - dStamina) * 200.0 / (200.0 + effTen);
                dStamina = 1.0 - reducedPenalty;
            }

            // ── Fatigue Recovery: shift capacity window up ────────────────────
            double cFatigueRec = cStats.getOrDefault("fatigueRecovery", 0.0);
            double dFatigueRec = dStats.getOrDefault("fatigueRecovery", 0.0);
            double cStaminaPreFR = cStamina;
            double dStaminaPreFR = dStamina;
            if (cFatigueRec > 0 && cConsecWins > 0) {
                cStamina = Math.min(1.0, cStamina + effectiveFatigueRecovery(cFatigueRec));
            }
            if (dFatigueRec > 0 && dConsecWins > 0) {
                dStamina = Math.min(1.0, dStamina + effectiveFatigueRecovery(dFatigueRec));
            }

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

            // ── DEX update: consume used DEX, recover fraction via dexPosture / dexMaxPosture ──
            double cDexFactor      = 0.33 + cMods.dexProficiency();
            double cDexUsed        = cCurrentDex * cDexFactor;
            double cMaxDex         = cStats.getOrDefault("dexterity", 0.0);
            double cDexMaxPosture  = cStats.getOrDefault("dexMaxPosture", 0.0);
            double cDexRecovered   = cMods.dexPosture() * cDexUsed + cDexMaxPosture * cMaxDex;
            double cNextDex        = Math.max(0.0, cCurrentDex - cDexUsed + cDexRecovered);
            cHeroDex.put(cHero.getId(), cNextDex);

            double dDexFactor      = 0.33 + dMods.dexProficiency();
            double dDexUsed        = dCurrentDex * dDexFactor;
            double dMaxDex         = dStats.getOrDefault("dexterity", 0.0);
            double dDexMaxPosture  = dStats.getOrDefault("dexMaxPosture", 0.0);
            double dDexRecovered   = dMods.dexPosture() * dDexUsed + dDexMaxPosture * dMaxDex;
            double dNextDex        = Math.max(0.0, dCurrentDex - dDexUsed + dDexRecovered);
            dHeroDex.put(dHero.getId(), dNextDex);

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
                    double wsChanceC2 = Math.min(1.0, ws.getSpellChance() + cSpellActivation);
                    boolean wsFiredC2 = random.nextDouble() < wsChanceC2;
                    Map<String, Object> ev = new LinkedHashMap<>();
                    ev.put("spellName", ws.getSpellName()); ev.put("heroName", cHero.getTemplate().getDisplayName());
                    ev.put("trigger", wsTrig); ev.put("chance", Math.round(wsChanceC2 * 1000.0) / 10.0); ev.put("fired", wsFiredC2);
                    if (!wsFiredC2) { cSpells.add(ev); continue; }
                    cMana -= ws.getSpellManaCost();
                    cWsUsages.merge(wsKey, 1, Integer::sum);
                    List<ActiveBuff> targetBufs = ws.isAffectsOpponent() ? dBufList : cBufList;
                    applyWeaponSpellBonuses(ws, null, targetBufs, ws.getLastsTurns(), true);
                    ev.put("manaCost", ws.getSpellManaCost());
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
                    double wsChanceD2 = Math.min(1.0, ws.getSpellChance() + dSpellActivation);
                    boolean wsFiredD2 = random.nextDouble() < wsChanceD2;
                    Map<String, Object> ev = new LinkedHashMap<>();
                    ev.put("spellName", ws.getSpellName()); ev.put("heroName", dHero.getTemplate().getDisplayName());
                    ev.put("trigger", wsTrig); ev.put("chance", Math.round(wsChanceD2 * 1000.0) / 10.0); ev.put("fired", wsFiredD2);
                    if (!wsFiredD2) { dSpells.add(ev); continue; }
                    dMana -= ws.getSpellManaCost();
                    dWsUsages.merge(wsKey, 1, Integer::sum);
                    List<ActiveBuff> targetBufs = ws.isAffectsOpponent() ? cBufList : dBufList;
                    applyWeaponSpellBonuses(ws, null, targetBufs, ws.getLastsTurns(), true);
                    ev.put("manaCost", ws.getSpellManaCost());
                    if (ws.isAffectsOpponent()) ev.put("affectsOpponent", true);
                    dSpells.add(ev);
                }
            }

            // ── Element bonus damage ──────────────────────────────────────────
            double cElemBonus = calculateElementBonus(cHero, dHero);
            double dElemBonus = calculateElementBonus(dHero, cHero);
            cAttack += cElemBonus;
            dAttack += dElemBonus;

            // ── Crit extends active Rot ───────────────────────────────────────
            if (cBreak.didCrit() && dRotState != null && dRotState.remainingTurns() > 0) {
                dRotState = new RotState(dRotState.remainingTurns() + 1, dRotState.totalTurns() + 1, dRotState.maxReduction(), dRotState.stackBonus());
                dHeroRot.put(dHero.getId(), dRotState);
            }
            if (dBreak.didCrit() && cRotState != null && cRotState.remainingTurns() > 0) {
                cRotState = new RotState(cRotState.remainingTurns() + 1, cRotState.totalTurns() + 1, cRotState.maxReduction(), cRotState.stackBonus());
                cHeroRot.put(cHero.getId(), cRotState);
            }

            // ── Apply new Rot from each side's summon ────────────────────────
            double cRot = challengerTeam.summonBonuses().getOrDefault("rot", 0.0);
            double dRot = defenderTeam.summonBonuses().getOrDefault("rot", 0.0);
            boolean cAppliedRot = false, dAppliedRot = false;
            if (cRot > 0 && random.nextDouble() < cRot) {
                cAppliedRot = true;
                int turns = 3 + (int) Math.max(0, (cMods.dexProficiency() - 0.30) / 0.10);
                double maxRed = Math.min(0.75, 0.50 + cMods.dexProficiency() * 0.50);
                double stackBonus = (dRotState != null && dRotState.remainingTurns() > 0)
                        ? Math.min(0.15, dRotState.stackBonus() + 0.03) : 0.0;
                dHeroRot.put(dHero.getId(), new RotState(turns, turns, maxRed, stackBonus));
                dRotState = dHeroRot.get(dHero.getId());
            }
            if (dRot > 0 && random.nextDouble() < dRot) {
                dAppliedRot = true;
                int turns = 3 + (int) Math.max(0, (dMods.dexProficiency() - 0.30) / 0.10);
                double maxRed = Math.min(0.75, 0.50 + dMods.dexProficiency() * 0.50);
                double stackBonus = (cRotState != null && cRotState.remainingTurns() > 0)
                        ? Math.min(0.15, cRotState.stackBonus() + 0.03) : 0.0;
                cHeroRot.put(cHero.getId(), new RotState(turns, turns, maxRed, stackBonus));
                cRotState = cHeroRot.get(cHero.getId());
            }

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
            if (cTenacity > 0) { round.put("attackerTenacity", Math.round(cTenacity)); if (cStaminaPreFR > cStaminaRaw) round.put("attackerCapacityRaw", Math.round(cStaminaRaw * 1000.0) / 1000.0); }
            if (dTenacity > 0) { round.put("defenderTenacity", Math.round(dTenacity)); if (dStaminaPreFR > dStaminaRaw) round.put("defenderCapacityRaw", Math.round(dStaminaRaw * 1000.0) / 1000.0); }
            if (cFatigueRec > 0 && cConsecWins > 0) { round.put("attackerFatigueRec", Math.round(cFatigueRec * 1000.0) / 10.0); if (cStamina > cStaminaPreFR) round.put("attackerCapacityBeforeFR", Math.round(cStaminaPreFR * 1000.0) / 1000.0); }
            if (dFatigueRec > 0 && dConsecWins > 0) { round.put("defenderFatigueRec", Math.round(dFatigueRec * 1000.0) / 10.0); if (dStamina > dStaminaPreFR) round.put("defenderCapacityBeforeFR", Math.round(dStaminaPreFR * 1000.0) / 1000.0); }
            round.put("attackerPaContrib",        Math.round(cBreak.paContrib()  * 100.0) / 100.0);
            round.put("attackerMpContrib",        Math.round(cBreak.mpContrib()  * 100.0) / 100.0);
            round.put("attackerDexContrib",       Math.round(cBreak.dexContrib() * 100.0) / 100.0);
            round.put("attackerRawAttack",        Math.round(cBreak.rawAttack()  * 100.0) / 100.0);
            if (cBreak.staminaReduction() > 0.001) round.put("attackerStaminaReduction", Math.round(cBreak.staminaReduction() * 100.0) / 100.0);
            if (cBreak.didCrit())                  round.put("attackerCrit", true);
            if (cBreak.didMagicProf())             round.put("attackerMagicProf", true);
            if (cDexFactor >= 0.80)                round.put("attackerHighDex", true);
            round.put("attackerDexFactor",        Math.round((0.33 + cMods.dexProficiency()) * 1000.0) / 1000.0);
            round.put("attackerDexProficiency",   Math.round((0.33 + cMods.dexProficiency()) * 1000.0) / 1000.0);
            round.put("attackerDexPosture",       Math.round(cMods.dexPosture()     * 1000.0) / 1000.0);
            if (cDexMaxPosture > 0) {
                round.put("attackerDexMaxPosture", Math.round(cDexMaxPosture * 1000.0) / 1000.0);
                round.put("attackerDexMaxPostureRecov", Math.round(cDexMaxPosture * cMaxDex * 100.0) / 100.0);
            }
            double cOffPos = cStats.getOrDefault("offPositioning", 0.0);
            if (cOffPos > 0) round.put("attackerOffPositioning", Math.round(cOffPos * 1000.0) / 1000.0);
            double cOffSlotPenalty = cStats.getOrDefault("_offSlotPenalty", 0.0);
            if (cOffSlotPenalty > 0) {
                round.put("attackerOffSlotPenalty",  Math.round(cOffSlotPenalty * 1000.0) / 1000.0);
                round.put("attackerOffSlotRawMax",   Math.round(cStats.getOrDefault("_offSlotRawMax",  0.0) * 1000.0) / 1000.0);
                round.put("attackerOffSlotEffMax",   Math.round(cStats.getOrDefault("_offSlotEffMax",  0.0) * 1000.0) / 1000.0);
            }
            round.put("attackerCritDamagePct",    Math.round(cMods.critDamage()       * 1000.0) / 1000.0);
            if (cBreak.didCrit())                  round.put("attackerCritPaBonus",     Math.round(cBreak.critPaBonus()      * 100.0)  / 100.0);
            round.put("attackerMpRoll",            Math.round(cBreak.mpRoll()      * 1000.0) / 1000.0);
            if (cBreak.didMagicProf())             round.put("attackerMpFirstRoll", Math.round(cBreak.mpFirstRoll() * 1000.0) / 1000.0);
            round.put("attackerCritChance",        Math.round(cMods.critChance()       * 1000.0) / 1000.0);
            round.put("attackerMagicProfChance",   Math.round(cMods.magicProficiency() * 1000.0) / 1000.0);
            round.put("attackerStatPa",   Math.round(cStats.getOrDefault("physicalAttack", 0.0) * 100.0) / 100.0);
            round.put("attackerStatMp",   Math.round(cStats.getOrDefault("magicPower",     0.0) * 100.0) / 100.0);
            round.put("attackerStatDex",  Math.round(cCurrentDex * 100.0) / 100.0);
            if (cMods.attackBonus() > 0)       round.put("attackerStatAttack",        Math.round(cMods.attackBonus()                               * 100.0) / 100.0);
            if (cSpellActivation > 0)          round.put("attackerStatSpellActivation", Math.round(cSpellActivation                                  * 1000.0) / 1000.0);
            round.put("attackerStatElem", Math.round(cStats.getOrDefault("element",        0.0) * 100.0) / 100.0);
            round.put("attackerStatMana", Math.round(cStats.getOrDefault("mana",           0.0) * 100.0) / 100.0);
            round.put("attackerStatStam", Math.round(cStats.getOrDefault("stamina",        0.0) * 100.0) / 100.0);
            round.put("attackerDexUsed",      Math.round(cDexUsed      * 100.0) / 100.0);
            round.put("attackerDexRecovered", Math.round(cDexRecovered * 100.0) / 100.0);
            round.put("attackerDexRemaining", Math.round(cNextDex      * 100.0) / 100.0);
            if (getEffectiveElement(cHero) != null) round.put("attackerElement", getEffectiveElement(cHero).name());
            round.put("defenderPaContrib",        Math.round(dBreak.paContrib()  * 100.0) / 100.0);
            round.put("defenderMpContrib",        Math.round(dBreak.mpContrib()  * 100.0) / 100.0);
            round.put("defenderDexContrib",       Math.round(dBreak.dexContrib() * 100.0) / 100.0);
            round.put("defenderRawAttack",        Math.round(dBreak.rawAttack()  * 100.0) / 100.0);
            if (dBreak.staminaReduction() > 0.001) round.put("defenderStaminaReduction", Math.round(dBreak.staminaReduction() * 100.0) / 100.0);
            if (dBreak.didCrit())                  round.put("defenderCrit", true);
            if (dBreak.didMagicProf())             round.put("defenderMagicProf", true);
            if (dDexFactor >= 0.80)                round.put("defenderHighDex", true);
            round.put("defenderDexFactor",        Math.round((0.33 + dMods.dexProficiency()) * 1000.0) / 1000.0);
            round.put("defenderDexProficiency",   Math.round((0.33 + dMods.dexProficiency()) * 1000.0) / 1000.0);
            round.put("defenderDexPosture",       Math.round(dMods.dexPosture()     * 1000.0) / 1000.0);
            if (dDexMaxPosture > 0) {
                round.put("defenderDexMaxPosture", Math.round(dDexMaxPosture * 1000.0) / 1000.0);
                round.put("defenderDexMaxPostureRecov", Math.round(dDexMaxPosture * dMaxDex * 100.0) / 100.0);
            }
            double dOffPos = dStats.getOrDefault("offPositioning", 0.0);
            if (dOffPos > 0) round.put("defenderOffPositioning", Math.round(dOffPos * 1000.0) / 1000.0);
            double dOffSlotPenalty = dStats.getOrDefault("_offSlotPenalty", 0.0);
            if (dOffSlotPenalty > 0) {
                round.put("defenderOffSlotPenalty",  Math.round(dOffSlotPenalty * 1000.0) / 1000.0);
                round.put("defenderOffSlotRawMax",   Math.round(dStats.getOrDefault("_offSlotRawMax",  0.0) * 1000.0) / 1000.0);
                round.put("defenderOffSlotEffMax",   Math.round(dStats.getOrDefault("_offSlotEffMax",  0.0) * 1000.0) / 1000.0);
            }
            round.put("defenderCritDamagePct",    Math.round(dMods.critDamage()       * 1000.0) / 1000.0);
            if (dBreak.didCrit())                  round.put("defenderCritPaBonus",     Math.round(dBreak.critPaBonus()      * 100.0)  / 100.0);
            round.put("defenderMpRoll",            Math.round(dBreak.mpRoll()      * 1000.0) / 1000.0);
            if (dBreak.didMagicProf())             round.put("defenderMpFirstRoll", Math.round(dBreak.mpFirstRoll() * 1000.0) / 1000.0);
            round.put("defenderCritChance",        Math.round(dMods.critChance()       * 1000.0) / 1000.0);
            round.put("defenderMagicProfChance",   Math.round(dMods.magicProficiency() * 1000.0) / 1000.0);
            round.put("defenderStatPa",   Math.round(dStats.getOrDefault("physicalAttack", 0.0) * 100.0) / 100.0);
            round.put("defenderStatMp",   Math.round(dStats.getOrDefault("magicPower",     0.0) * 100.0) / 100.0);
            round.put("defenderStatDex",  Math.round(dCurrentDex * 100.0) / 100.0);
            if (dMods.attackBonus() > 0)       round.put("defenderStatAttack",        Math.round(dMods.attackBonus()                               * 100.0) / 100.0);
            if (dSpellActivation > 0)          round.put("defenderStatSpellActivation", Math.round(dSpellActivation                                  * 1000.0) / 1000.0);
            round.put("defenderStatElem", Math.round(dStats.getOrDefault("element",        0.0) * 100.0) / 100.0);
            round.put("defenderStatMana", Math.round(dStats.getOrDefault("mana",           0.0) * 100.0) / 100.0);
            round.put("defenderStatStam", Math.round(dStats.getOrDefault("stamina",        0.0) * 100.0) / 100.0);
            round.put("defenderDexUsed",      Math.round(dDexUsed      * 100.0) / 100.0);
            round.put("defenderDexRecovered", Math.round(dDexRecovered * 100.0) / 100.0);
            round.put("defenderDexRemaining", Math.round(dNextDex      * 100.0) / 100.0);
            if (getEffectiveElement(dHero) != null) round.put("defenderElement", getEffectiveElement(dHero).name());
            // Immunities — only emit when non-zero so the log stays clean
            double cPhysImmun = cStats.getOrDefault("physicalImmunity", 0.0);
            double cMagicImmun = cStats.getOrDefault("magicImmunity",   0.0);
            double cDexEvas    = cStats.getOrDefault("dexEvasiveness",  0.0);
            double dPhysImmun = dStats.getOrDefault("physicalImmunity", 0.0);
            double dMagicImmun = dStats.getOrDefault("magicImmunity",   0.0);
            double dDexEvas    = dStats.getOrDefault("dexEvasiveness",  0.0);
            // denied = contrib * immun / (1 - immun)  — inverse of how immunity was applied
            if (cPhysImmun  > 0) { round.put("attackerPhysImmunity",  Math.round(cPhysImmun  * 10000.0) / 100.0); round.put("attackerPhysDenied",  Math.round(dBreak.paContrib()  * cPhysImmun  / (1 - cPhysImmun)  * 100.0) / 100.0); }
            if (cMagicImmun > 0) { round.put("attackerMagicImmunity", Math.round(cMagicImmun * 10000.0) / 100.0); round.put("attackerMagicDenied", Math.round(dBreak.mpContrib()  * cMagicImmun / (1 - cMagicImmun) * 100.0) / 100.0); }
            if (cDexEvas    > 0) { round.put("attackerDexEvasiveness",Math.round(cDexEvas    * 10000.0) / 100.0); round.put("attackerDexDenied",   Math.round(dBreak.dexContrib() * cDexEvas    / (1 - cDexEvas)    * 100.0) / 100.0); }
            if (dPhysImmun  > 0) { round.put("defenderPhysImmunity",  Math.round(dPhysImmun  * 10000.0) / 100.0); round.put("defenderPhysDenied",  Math.round(cBreak.paContrib()  * dPhysImmun  / (1 - dPhysImmun)  * 100.0) / 100.0); }
            if (dMagicImmun > 0) { round.put("defenderMagicImmunity", Math.round(dMagicImmun * 10000.0) / 100.0); round.put("defenderMagicDenied", Math.round(cBreak.mpContrib()  * dMagicImmun / (1 - dMagicImmun) * 100.0) / 100.0); }
            if (dDexEvas    > 0) { round.put("defenderDexEvasiveness",Math.round(dDexEvas    * 10000.0) / 100.0); round.put("defenderDexDenied",   Math.round(cBreak.dexContrib() * dDexEvas    / (1 - dDexEvas)    * 100.0) / 100.0); }
            round.put("attackerImagePath", cHero.getTemplate().getImagePath() != null ? cHero.getTemplate().getImagePath() : "");
            round.put("defenderImagePath", dHero.getTemplate().getImagePath() != null ? dHero.getTemplate().getImagePath() : "");
            if (cElemBonus > 0) round.put("attackerElementBonus", Math.round(cElemBonus * 100.0) / 100.0);
            if (dElemBonus > 0) round.put("defenderElementBonus", Math.round(dElemBonus * 100.0) / 100.0);
            if (!cSpells.isEmpty()) round.put("challengerSpells", cSpells);
            if (!dSpells.isEmpty()) round.put("defenderSpells",   dSpells);
            // ── Mana Recharge (applied end of round, before manaAfter snapshot) ─
            round.put("challengerManaBeforeRecharge", Math.round(cMana * 10.0) / 10.0);
            round.put("defenderManaBeforeRecharge",   Math.round(dMana * 10.0) / 10.0);
            double cManaRecharge = challengerTeam.summonBonuses().getOrDefault("manaRecharge", 0.0);
            double dManaRecharge = defenderTeam.summonBonuses().getOrDefault("manaRecharge", 0.0);
            if (cManaRecharge > 0) {
                double cMissing = cManaTotal - cMana;
                double cRegen = cMissing * cManaRecharge;
                double cManaOld = cMana;
                cMana = Math.min(cMana + cRegen, cManaTotal);
                double cActualRegen = cMana - cManaOld;
                if (cActualRegen > 0.001) {
                    round.put("challengerManaRegen", Math.round(cActualRegen * 10.0) / 10.0);
                    round.put("challengerManaRechargeRate", Math.round(cManaRecharge * 10000.0) / 100.0);
                }
            }
            if (dManaRecharge > 0) {
                double dMissing = dManaTotal - dMana;
                double dRegen = dMissing * dManaRecharge;
                double dManaOld = dMana;
                dMana = Math.min(dMana + dRegen, dManaTotal);
                double dActualRegen = dMana - dManaOld;
                if (dActualRegen > 0.001) {
                    round.put("defenderManaRegen", Math.round(dActualRegen * 10.0) / 10.0);
                    round.put("defenderManaRechargeRate", Math.round(dManaRecharge * 10000.0) / 100.0);
                }
            }
            round.put("challengerManaAfter", Math.round(cMana * 10.0) / 10.0);
            round.put("defenderManaAfter",   Math.round(dMana * 10.0) / 10.0);
            if (cSpellLearn  > 0) round.put("attackerSpellLearn",  Math.round(cSpellLearn  * 10000.0) / 100.0);
            if (cSpellCopy   > 0) round.put("attackerSpellCopy",   Math.round(cSpellCopy   * 10000.0) / 100.0);
            if (cSpellAbsorb > 0) round.put("attackerSpellAbsorb", Math.round(cSpellAbsorb * 10000.0) / 100.0);
            if (dSpellLearn  > 0) round.put("defenderSpellLearn",  Math.round(dSpellLearn  * 10000.0) / 100.0);
            if (dSpellCopy   > 0) round.put("defenderSpellCopy",   Math.round(dSpellCopy   * 10000.0) / 100.0);
            if (dSpellAbsorb > 0) round.put("defenderSpellAbsorb", Math.round(dSpellAbsorb * 10000.0) / 100.0);
            if (cSpellMastery > 0) round.put("attackerSpellMastery", Math.round(cSpellMastery * 1000.0) / 1000.0);
            if (dSpellMastery > 0) round.put("defenderSpellMastery", Math.round(dSpellMastery * 1000.0) / 1000.0);
            // Rot round data
            if (cRot > 0) round.put("attackerRotChance", Math.round(cRot * 10000.0) / 100.0);
            if (dRot > 0) round.put("defenderRotChance", Math.round(dRot * 10000.0) / 100.0);
            if (cAppliedRot) round.put("attackerAppliedRot", true);
            if (dAppliedRot) round.put("defenderAppliedRot", true);
            if (cRotReduction > 0.001) {
                round.put("attackerRotActive", true);
                round.put("attackerRotRemaining", cRotState != null ? cRotState.remainingTurns() : 0);
                round.put("attackerRotTotal",     cRotState != null ? cRotState.totalTurns()     : 0);
                round.put("attackerRotReduction", Math.round(cRotReduction * 10000.0) / 100.0);
            }
            if (dRotReduction > 0.001) {
                round.put("defenderRotActive", true);
                round.put("defenderRotRemaining", dRotState != null ? dRotState.remainingTurns() : 0);
                round.put("defenderRotTotal",     dRotState != null ? dRotState.totalTurns()     : 0);
                round.put("defenderRotReduction", Math.round(dRotReduction * 10000.0) / 100.0);
            }
            // Show newly-applied rot even if reduction = 0 this round (first turn starts next)
            if (cAppliedRot && cRotReduction < 0.001) round.put("defenderRotActive", true);
            if (dAppliedRot && dRotReduction < 0.001) round.put("attackerRotActive", true);
            // Cleanse round data
            if (cCleanse > 0) round.put("attackerCleanseChance", Math.round(cCleanse * 10000.0) / 100.0);
            if (dCleanse > 0) round.put("defenderCleanseChance", Math.round(dCleanse * 10000.0) / 100.0);
            if (cCleansed) round.put("attackerCleansed", true);
            if (dCleansed) round.put("defenderCleansed", true);

            // ── Tick Rot (decrement remaining turns) ─────────────────────────
            RotState cRotFinal = cHeroRot.get(cHero.getId());
            RotState dRotFinal = dHeroRot.get(dHero.getId());
            if (cRotFinal != null && cRotFinal.remainingTurns() > 0)
                cHeroRot.put(cHero.getId(), new RotState(cRotFinal.remainingTurns() - 1, cRotFinal.totalTurns(), cRotFinal.maxReduction(), cRotFinal.stackBonus()));
            if (dRotFinal != null && dRotFinal.remainingTurns() > 0)
                dHeroRot.put(dHero.getId(), new RotState(dRotFinal.remainingTurns() - 1, dRotFinal.totalTurns(), dRotFinal.maxReduction(), dRotFinal.stackBonus()));

            // ── Determine winner ──────────────────────────────────────────────
            if (cAttack > dAttack) {
                round.put("winner", "attacker");
                int xp = 4 + 2 * dHero.getLevel();
                challengerXp.merge(cHero.getTemplate().getDisplayName(), xp, Integer::sum);
                cConsecWins++; dConsecWins = 0;
                cHero.setClashesWon(cHero.getClashesWon() + 1);
                cHero.setCurrentWinStreak(cHero.getCurrentWinStreak() + 1);
                cHero.setCurrentLossStreak(0);
                if (cHero.getCurrentWinStreak() > cHero.getBestWinStreak()) cHero.setBestWinStreak(cHero.getCurrentWinStreak());
                dHero.setClashesLost(dHero.getClashesLost() + 1);
                dHero.setCurrentLossStreak(dHero.getCurrentLossStreak() + 1);
                dHero.setCurrentWinStreak(0);
                if (dHero.getCurrentLossStreak() > dHero.getBestLossStreak()) dHero.setBestLossStreak(dHero.getCurrentLossStreak());
                if (cAttack > cHero.getMaxDamageDealt())         cHero.setMaxDamageDealt(cAttack);
                if (dAttack > dHero.getMaxDamageDealt())         dHero.setMaxDamageDealt(dAttack);
                if (dAttack > cHero.getMaxDamageReceived())      cHero.setMaxDamageReceived(dAttack);
                if (cAttack > dHero.getMaxDamageReceived())      dHero.setMaxDamageReceived(cAttack);
                if (cBreak.paContrib()  > cHero.getMaxPaDamage())  cHero.setMaxPaDamage(cBreak.paContrib());
                if (cBreak.mpContrib()  > cHero.getMaxMpDamage())  cHero.setMaxMpDamage(cBreak.mpContrib());
                if (cBreak.dexContrib() > cHero.getMaxDexDamage()) cHero.setMaxDexDamage(cBreak.dexContrib());
                if (dBreak.paContrib()  > dHero.getMaxPaDamage())  dHero.setMaxPaDamage(dBreak.paContrib());
                if (dBreak.mpContrib()  > dHero.getMaxMpDamage())  dHero.setMaxMpDamage(dBreak.mpContrib());
                if (dBreak.dexContrib() > dHero.getMaxDexDamage()) dHero.setMaxDexDamage(dBreak.dexContrib());
                if (cElemBonus > cHero.getMaxElemDamage()) cHero.setMaxElemDamage(cElemBonus);
                if (dElemBonus > dHero.getMaxElemDamage()) dHero.setMaxElemDamage(dElemBonus);
                cHero.setTotalPaDamage(cHero.getTotalPaDamage() + cBreak.paContrib());
                cHero.setTotalMpDamage(cHero.getTotalMpDamage() + cBreak.mpContrib());
                cHero.setTotalDexDamage(cHero.getTotalDexDamage() + cBreak.dexContrib());
                cHero.setTotalElemDamage(cHero.getTotalElemDamage() + cElemBonus);
                dHero.setTotalPaDamage(dHero.getTotalPaDamage() + dBreak.paContrib());
                dHero.setTotalMpDamage(dHero.getTotalMpDamage() + dBreak.mpContrib());
                dHero.setTotalDexDamage(dHero.getTotalDexDamage() + dBreak.dexContrib());
                dHero.setTotalElemDamage(dHero.getTotalElemDamage() + dElemBonus);
                // ── ON_DEATH: defender eliminated ────────────────────────────
                List<Map<String, Object>> dDeathEvts = fireOnDeathSpells(dHero, dSpellActivation, dSpellMastery, random,
                        cStats, cBufList, dNextHeroBufs, dTeamBufs, cNextHeroBufs, cTeamBufs);
                dSpells.addAll(dDeathEvts);
                dIdx++;
            } else {
                round.put("winner", "defender");
                int xp = 4 + 2 * cHero.getLevel();
                defenderXp.merge(dHero.getTemplate().getDisplayName(), xp, Integer::sum);
                dConsecWins++; cConsecWins = 0;
                dHero.setClashesWon(dHero.getClashesWon() + 1);
                dHero.setCurrentWinStreak(dHero.getCurrentWinStreak() + 1);
                dHero.setCurrentLossStreak(0);
                if (dHero.getCurrentWinStreak() > dHero.getBestWinStreak()) dHero.setBestWinStreak(dHero.getCurrentWinStreak());
                cHero.setClashesLost(cHero.getClashesLost() + 1);
                cHero.setCurrentLossStreak(cHero.getCurrentLossStreak() + 1);
                cHero.setCurrentWinStreak(0);
                if (cHero.getCurrentLossStreak() > cHero.getBestLossStreak()) cHero.setBestLossStreak(cHero.getCurrentLossStreak());
                if (dAttack > dHero.getMaxDamageDealt())         dHero.setMaxDamageDealt(dAttack);
                if (cAttack > cHero.getMaxDamageDealt())         cHero.setMaxDamageDealt(cAttack);
                if (cAttack > dHero.getMaxDamageReceived())      dHero.setMaxDamageReceived(cAttack);
                if (dAttack > cHero.getMaxDamageReceived())      cHero.setMaxDamageReceived(dAttack);
                if (cBreak.paContrib()  > cHero.getMaxPaDamage())  cHero.setMaxPaDamage(cBreak.paContrib());
                if (cBreak.mpContrib()  > cHero.getMaxMpDamage())  cHero.setMaxMpDamage(cBreak.mpContrib());
                if (cBreak.dexContrib() > cHero.getMaxDexDamage()) cHero.setMaxDexDamage(cBreak.dexContrib());
                if (dBreak.paContrib()  > dHero.getMaxPaDamage())  dHero.setMaxPaDamage(dBreak.paContrib());
                if (dBreak.mpContrib()  > dHero.getMaxMpDamage())  dHero.setMaxMpDamage(dBreak.mpContrib());
                if (dBreak.dexContrib() > dHero.getMaxDexDamage()) dHero.setMaxDexDamage(dBreak.dexContrib());
                if (cElemBonus > cHero.getMaxElemDamage()) cHero.setMaxElemDamage(cElemBonus);
                if (dElemBonus > dHero.getMaxElemDamage()) dHero.setMaxElemDamage(dElemBonus);
                cHero.setTotalPaDamage(cHero.getTotalPaDamage() + cBreak.paContrib());
                cHero.setTotalMpDamage(cHero.getTotalMpDamage() + cBreak.mpContrib());
                cHero.setTotalDexDamage(cHero.getTotalDexDamage() + cBreak.dexContrib());
                cHero.setTotalElemDamage(cHero.getTotalElemDamage() + cElemBonus);
                dHero.setTotalPaDamage(dHero.getTotalPaDamage() + dBreak.paContrib());
                dHero.setTotalMpDamage(dHero.getTotalMpDamage() + dBreak.mpContrib());
                dHero.setTotalDexDamage(dHero.getTotalDexDamage() + dBreak.dexContrib());
                dHero.setTotalElemDamage(dHero.getTotalElemDamage() + dElemBonus);
                // ── ON_DEATH: challenger eliminated ──────────────────────────
                List<Map<String, Object>> cDeathEvts = fireOnDeathSpells(cHero, cSpellActivation, cSpellMastery, random,
                        dStats, dBufList, cNextHeroBufs, cTeamBufs, dNextHeroBufs, dTeamBufs);
                cSpells.addAll(cDeathEvts);
                cIdx++;
            }

            rounds.add(round);
        }

        String winner = cIdx < cSlots.size() ? "challenger" : "defender";

        // ── Award XP with Exp Bonus ───────────────────────────────────────────
        Map<String, Map<String, Object>> challengerLevelUps = new LinkedHashMap<>();
        Map<String, Map<String, Object>> defenderLevelUps   = new LinkedHashMap<>();

        for (HeroSlot hs : challengerTeam.heroSlots()) {
            Hero hero = hs.hero();
            int baseXp = challengerXp.getOrDefault(hero.getTemplate().getDisplayName(), 0);
            if (baseXp > 0) {
                int oldLevel = hero.getLevel();
                double expMult = 1.0 + cHeroExpBonus.getOrDefault(hero.getId(), 0.0);
                hero.setCurrentXp(hero.getCurrentXp() + (int) Math.round(baseXp * expMult));
                checkLevelUp(hero);
                int levelsGained = hero.getLevel() - oldLevel;
                if (levelsGained > 0) {
                    challengerLevelUps.put(hero.getTemplate().getDisplayName(),
                        buildLevelUpInfo(hero, oldLevel, levelsGained));
                }
            }
            heroRepository.save(hero);
        }
        for (HeroSlot hs : defenderTeam.heroSlots()) {
            Hero hero = hs.hero();
            int baseXp = defenderXp.getOrDefault(hero.getTemplate().getDisplayName(), 0);
            if (baseXp > 0) {
                int oldLevel = hero.getLevel();
                double expMult = 1.0 + dHeroExpBonus.getOrDefault(hero.getId(), 0.0);
                hero.setCurrentXp(hero.getCurrentXp() + (int) Math.round(baseXp * expMult));
                checkLevelUp(hero);
                int levelsGained = hero.getLevel() - oldLevel;
                if (levelsGained > 0) {
                    defenderLevelUps.put(hero.getTemplate().getDisplayName(),
                        buildLevelUpInfo(hero, oldLevel, levelsGained));
                }
            }
            heroRepository.save(hero);
        }

        int challengerSummonXp = "challenger".equals(winner) ? 1 : 0;
        int defenderSummonXp   = "defender".equals(winner)   ? 1 : 0;

        if (challengerTeam.summon() != null && challengerSummonXp > 0) {
            Summon s = challengerTeam.summon();
            int oldSummonLevel = s.getLevel();
            s.setCurrentXp(s.getCurrentXp() + challengerSummonXp);
            checkSummonLevelUp(s);
            summonRepository.save(s);
            int gained = s.getLevel() - oldSummonLevel;
            if (gained > 0) challengerLevelUps.put(s.getTemplate().getDisplayName(), buildSummonLevelUpInfo(s, oldSummonLevel, gained));
        }
        if (defenderTeam.summon() != null && defenderSummonXp > 0) {
            Summon s = defenderTeam.summon();
            int oldSummonLevel = s.getLevel();
            s.setCurrentXp(s.getCurrentXp() + defenderSummonXp);
            checkSummonLevelUp(s);
            summonRepository.save(s);
            int gained = s.getLevel() - oldSummonLevel;
            if (gained > 0) defenderLevelUps.put(s.getTemplate().getDisplayName(), buildSummonLevelUpInfo(s, oldSummonLevel, gained));
        }

        // ── Build result ──────────────────────────────────────────────────────
        Map<String, Object> result = new LinkedHashMap<>();

        double cTeamPower = challengerTeam.heroSlots().stream()
                .mapToDouble(hs -> buildBattleStats(hs.hero(), hs.slotNumber(), challengerTeam.summonBonuses()).values().stream().mapToDouble(Double::doubleValue).sum())
                .sum();
        double dTeamPower = defenderTeam.heroSlots().stream()
                .mapToDouble(hs -> buildBattleStats(hs.hero(), hs.slotNumber(), defenderTeam.summonBonuses()).values().stream().mapToDouble(Double::doubleValue).sum())
                .sum();

        Map<String, Object> challengerInfo = new LinkedHashMap<>();
        challengerInfo.put("username", challengerTeam.username());
        challengerInfo.put("teamPower", Math.round(cTeamPower));
        if (challengerTeam.profileImagePath() != null) challengerInfo.put("profileImagePath", challengerTeam.profileImagePath());
        challengerInfo.put("heroes", challengerTeam.heroSlots().stream().map(hs -> {
            Map<String, Object> h = new LinkedHashMap<>();
            h.put("name",      hs.hero().getTemplate().getDisplayName());
            h.put("imagePath", hs.hero().getTemplate().getImagePath() != null ? hs.hero().getTemplate().getImagePath() : "");
            h.put("level",     hs.hero().getLevel());
            if (getEffectiveElement(hs.hero()) != null) h.put("element", getEffectiveElement(hs.hero()).name());
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
        defenderInfo.put("teamPower", Math.round(dTeamPower));
        if (defenderTeam.profileImagePath() != null) defenderInfo.put("profileImagePath", defenderTeam.profileImagePath());
        defenderInfo.put("heroes", defenderTeam.heroSlots().stream().map(hs -> {
            Map<String, Object> h = new LinkedHashMap<>();
            h.put("name",      hs.hero().getTemplate().getDisplayName());
            h.put("imagePath", hs.hero().getTemplate().getImagePath() != null ? hs.hero().getTemplate().getImagePath() : "");
            h.put("level",     hs.hero().getLevel());
            if (getEffectiveElement(hs.hero()) != null) h.put("element", getEffectiveElement(hs.hero()).name());
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
        // Build xpBonusPercent maps (heroName → bonus %) for frontend display
        Map<String, Integer> cXpBonusPct = new LinkedHashMap<>();
        for (HeroSlot hs : challengerTeam.heroSlots()) {
            double bonus = cHeroExpBonus.getOrDefault(hs.hero().getId(), 0.0);
            if (bonus > 0) cXpBonusPct.put(hs.hero().getTemplate().getDisplayName(), (int) Math.round(bonus * 100));
        }
        Map<String, Integer> dXpBonusPct = new LinkedHashMap<>();
        for (HeroSlot hs : defenderTeam.heroSlots()) {
            double bonus = dHeroExpBonus.getOrDefault(hs.hero().getId(), 0.0);
            if (bonus > 0) dXpBonusPct.put(hs.hero().getTemplate().getDisplayName(), (int) Math.round(bonus * 100));
        }

        result.put("levelUps",               Map.of("challenger", challengerLevelUps, "defender", defenderLevelUps));
        result.put("xpGained",               Map.of("challenger", challengerXp, "defender", defenderXp));
        result.put("xpBonusPercent",          Map.of("challenger", cXpBonusPct, "defender", dXpBonusPct));
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

    private Map<String, Double> buildBattleStats(Hero hero, int slotNumber, Map<String, Double> summonBonuses) {
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
            stats.merge("dexMaxPosture",    t.getBonusDexMaxPosture(),   Double::sum);
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
            stats.merge("dexMaxPosture",    at.getBonusDexMaxPosture(),   Double::sum);
            stats.merge("critChance",       at.getBonusCritChance(),      Double::sum);
            stats.merge("critDamage",       at.getBonusCritDamage(),      Double::sum);
            stats.merge("expBonus",         at.getBonusExpBonus(),        Double::sum);
            stats.merge("goldBonus",        at.getBonusGoldBonus(),       Double::sum);
            stats.merge("itemDiscovery",    at.getBonusItemDiscovery(),   Double::sum);
            stats.merge("physicalImmunity", at.getBonusPhysicalImmunity(),Double::sum);
            stats.merge("magicImmunity",    at.getBonusMagicImmunity(),   Double::sum);
            stats.merge("dexEvasiveness",   at.getBonusDexEvasiveness(),  Double::sum);
            stats.merge("manaRecharge",     at.getBonusManaRecharge(),     Double::sum);
            stats.merge("tenacity",         at.getBonusTenacity(),         Double::sum);
            stats.merge("fatigueRecovery",  at.getBonusFatigueRecovery(),  Double::sum);
            stats.merge("cleanse",          at.getBonusCleanse(),          Double::sum);
            stats.merge("rot",              at.getBonusRot(),              Double::sum);
            stats.merge("offPositioning",   at.getBonusOffPositioning(),   Double::sum);
        }

        for (Map.Entry<String, Double> bonus : summonBonuses.entrySet()) {
            if (bonus.getValue() != 0) stats.merge(bonus.getKey(), bonus.getValue(), Double::sum);
        }

        // ── Seal stats (magicProficiency + critChance + spellActivation from seal table) ──
        int[] sealStats = PlayerService.getSealStats(hero.getSeal());
        stats.merge("magicProficiency", sealStats[0] / 100.0, Double::sum);
        stats.merge("critChance",       sealStats[1] / 100.0, Double::sum);
        stats.merge("spellActivation",  sealStats[2] / 100.0, Double::sum);

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
                double rawMaxPenalty = switch (slotTier) {
                    case "COMMONER"  -> 0.80;
                    case "ELITE"     -> 0.65;
                    case "LEGENDARY" -> 0.50;
                    default -> 0.0;
                };
                double offPos = stats.getOrDefault("offPositioning", 0.0);
                double maxPenalty = rawMaxPenalty * Math.max(0.0, 1.0 - offPos);
                if (heroStamina < requiredStamina) {
                    double penalty = maxPenalty * (1.0 - heroStamina / requiredStamina);
                    stats.put("stamina", heroStamina * (1.0 - penalty));
                    stats.put("_offSlotPenalty",    penalty);
                    stats.put("_offSlotRawMax",     rawMaxPenalty);
                    stats.put("_offSlotEffMax",     maxPenalty);
                    stats.put("_offSlotSlotTierOrd", (double) switch (slotTier) { case "COMMONER" -> 0; case "ELITE" -> 1; default -> 2; });
                }
            }
        }
        return stats;
    }

    /**
     * Capacity modifier based on consecutive wins and stamina effectiveness.
     */
    /** Soft-cap for Fatigue Recovery: full value up to 0.30, diminishing returns above. */
    private double effectiveFatigueRecovery(double fr) {
        if (fr <= 0.30) return fr;
        double excess = fr - 0.30;
        return 0.30 + excess * 0.30 / (excess + 0.50);
    }

    /** Soft-cap for Tenacity: full value up to 60, diminishing returns above. */
    private double effectiveTenacity(double tenacity) {
        if (tenacity <= 60) return tenacity;
        double excess = tenacity - 60.0;
        return 60.0 + excess * 60.0 / (excess + 60.0);
    }

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

    private HeroElement getEffectiveElement(Hero hero) {
        if (hero.getElementOverride() != null) {
            try { return HeroElement.valueOf(hero.getElementOverride()); } catch (IllegalArgumentException ignored) {}
        }
        return hero.getTemplate() != null ? hero.getTemplate().getElement() : null;
    }

    private double calculateElementBonus(Hero attacker, Hero defender) {
        HeroElement attackerElem = getEffectiveElement(attacker);
        HeroElement defenderElem = getEffectiveElement(defender);
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

    private Map<String, Object> buildLevelUpInfo(Hero hero, int oldLevel, int levelsGained) {
        HeroTemplate t = hero.getTemplate();
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("newLevel",   hero.getLevel());
        info.put("oldLevel",   oldLevel);
        info.put("heroName",   t.getDisplayName());
        info.put("imagePath",  t.getImagePath());
        info.put("gainPa",     Math.round(t.getGrowthPa()   * levelsGained * 10.0) / 10.0);
        info.put("gainMp",     Math.round(t.getGrowthMp()   * levelsGained * 10.0) / 10.0);
        info.put("gainDex",    Math.round(t.getGrowthDex()  * levelsGained * 10.0) / 10.0);
        info.put("gainElem",   Math.round(t.getGrowthElem() * levelsGained * 10.0) / 10.0);
        info.put("gainMana",   Math.round(t.getGrowthMana() * levelsGained * 10.0) / 10.0);
        info.put("gainStam",   Math.round(t.getGrowthStam() * levelsGained * 10.0) / 10.0);
        return info;
    }

    private Map<String, Object> buildSummonLevelUpInfo(Summon summon, int oldLevel, int levelsGained) {
        SummonTemplate t = summon.getTemplate();
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("newLevel",  summon.getLevel());
        info.put("oldLevel",  oldLevel);
        info.put("heroName",  t.getDisplayName());
        info.put("imagePath", t.getImagePath());
        info.put("gainPa",    Math.round(t.getGrowthPhysicalAttack() * levelsGained * 10.0) / 10.0);
        info.put("gainMp",    Math.round(t.getGrowthMp()             * levelsGained * 10.0) / 10.0);
        info.put("gainDex",   Math.round(t.getGrowthDex()            * levelsGained * 10.0) / 10.0);
        info.put("gainElem",  0.0);
        info.put("gainMana",  Math.round(t.getGrowthMana()           * levelsGained * 10.0) / 10.0);
        info.put("gainStam",  Math.round(t.getGrowthStamina()        * levelsGained * 10.0) / 10.0);
        return info;
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

    private record RotState(int remainingTurns, int totalTurns, double maxReduction, double stackBonus) {}

    private record SpellSnapshot(String spellName, double manaCost,
            double bonusPa, double bonusMp, double bonusDex,
            double bonusElem, double bonusMana, double bonusStam,
            String trigger, double chance) {}

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

    private Map<String, Object> getSnapBonusMap(SpellSnapshot snap) {
        Map<String, Object> m = new LinkedHashMap<>();
        if (snap.bonusPa()   != 0) m.put("physicalAttack", snap.bonusPa());
        if (snap.bonusMp()   != 0) m.put("magicPower",     snap.bonusMp());
        if (snap.bonusDex()  != 0) m.put("dexterity",      snap.bonusDex());
        if (snap.bonusElem() != 0) m.put("element",        snap.bonusElem());
        if (snap.bonusMana() != 0) m.put("mana",           snap.bonusMana());
        if (snap.bonusStam() != 0) m.put("stamina",        snap.bonusStam());
        return m;
    }

    private Map<String, Object> getAbilitySpellBonusMap(AbilityTemplate at) {
        Map<String, Object> m = new LinkedHashMap<>();
        if (at.getSpellBonusPa()   != 0) m.put("physicalAttack", at.getSpellBonusPa());
        if (at.getSpellBonusMp()   != 0) m.put("magicPower",     at.getSpellBonusMp());
        if (at.getSpellBonusDex()  != 0) m.put("dexterity",      at.getSpellBonusDex());
        if (at.getSpellBonusElem() != 0) m.put("element",        at.getSpellBonusElem());
        if (at.getSpellBonusMana() != 0) m.put("mana",           at.getSpellBonusMana());
        if (at.getSpellBonusStam() != 0) m.put("stamina",        at.getSpellBonusStam());
        return m;
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

    private void applyAbilitySpellBonuses(AbilitySpell asp,
                                           Map<String, Double> immediateStats,
                                           List<ActiveBuff> bufList,
                                           int lastsTurns,
                                           double mult) {
        Map<String, Double> bonuses = getAbilitySpellBonusMap_double(asp);
        if (lastsTurns == 0) {
            bonuses.forEach((k, v) -> { if (v != 0) immediateStats.merge(k, v * mult, Double::sum); });
        } else {
            bonuses.forEach((k, v) -> { if (v != 0) {
                bufList.add(new ActiveBuff(k, v * mult, lastsTurns));
                immediateStats.merge(k, v * mult, Double::sum);
            }});
        }
    }

    private void applyAbilityPassOnBonuses(AbilitySpell asp, List<ActiveBuff> nextBufs, List<ActiveBuff> teamBufs, double mult) {
        Map<String, Double> bonuses = getAbilitySpellBonusMap_double(asp);
        List<ActiveBuff> target = "NEXT".equals(asp.getPassOnType()) ? nextBufs : teamBufs;
        bonuses.forEach((k, v) -> { if (v != 0) target.add(new ActiveBuff(k, v * mult, 0)); });
    }

    private Map<String, Object> getAbilitySpellBonusMap(AbilitySpell asp) {
        Map<String, Object> m = new LinkedHashMap<>();
        if (asp.getSpellBonusPa()              != 0) m.put("physicalAttack",     asp.getSpellBonusPa());
        if (asp.getSpellBonusMp()              != 0) m.put("magicPower",         asp.getSpellBonusMp());
        if (asp.getSpellBonusDex()             != 0) m.put("dexterity",          asp.getSpellBonusDex());
        if (asp.getSpellBonusElem()            != 0) m.put("element",            asp.getSpellBonusElem());
        if (asp.getSpellBonusMana()            != 0) m.put("mana",               asp.getSpellBonusMana());
        if (asp.getSpellBonusStam()            != 0) m.put("stamina",            asp.getSpellBonusStam());
        if (asp.getSpellBonusAttack()          != 0) m.put("attack",             asp.getSpellBonusAttack());
        if (asp.getSpellBonusMagicProficiency()!= 0) m.put("magicProficiency",   asp.getSpellBonusMagicProficiency());
        if (asp.getSpellBonusSpellMastery()    != 0) m.put("spellMastery",       asp.getSpellBonusSpellMastery());
        if (asp.getSpellBonusSpellActivation() != 0) m.put("spellActivation",    asp.getSpellBonusSpellActivation());
        if (asp.getSpellBonusDexProficiency()  != 0) m.put("dexProficiency",     asp.getSpellBonusDexProficiency());
        if (asp.getSpellBonusDexPosture()      != 0) m.put("dexPosture",         asp.getSpellBonusDexPosture());
        if (asp.getSpellBonusDexMaxPosture()   != 0) m.put("dexMaxPosture",      asp.getSpellBonusDexMaxPosture());
        if (asp.getSpellBonusCritChance()      != 0) m.put("critChance",         asp.getSpellBonusCritChance());
        if (asp.getSpellBonusCritDamage()      != 0) m.put("critDamage",         asp.getSpellBonusCritDamage());
        if (asp.getSpellBonusExpBonus()        != 0) m.put("expBonus",           asp.getSpellBonusExpBonus());
        if (asp.getSpellBonusGoldBonus()       != 0) m.put("goldBonus",          asp.getSpellBonusGoldBonus());
        if (asp.getSpellBonusItemDiscovery()   != 0) m.put("itemDiscovery",      asp.getSpellBonusItemDiscovery());
        if (asp.getSpellBonusPhysicalImmunity()!= 0) m.put("physicalImmunity",   asp.getSpellBonusPhysicalImmunity());
        if (asp.getSpellBonusMagicImmunity()   != 0) m.put("magicImmunity",      asp.getSpellBonusMagicImmunity());
        if (asp.getSpellBonusDexEvasiveness()  != 0) m.put("dexEvasiveness",     asp.getSpellBonusDexEvasiveness());
        if (asp.getSpellBonusManaRecharge()    != 0) m.put("manaRecharge",       asp.getSpellBonusManaRecharge());
        if (asp.getSpellBonusTenacity()        != 0) m.put("tenacity",           asp.getSpellBonusTenacity());
        if (asp.getSpellBonusFatigueRecovery() != 0) m.put("fatigueRecovery",    asp.getSpellBonusFatigueRecovery());
        if (asp.getSpellBonusCleanse()         != 0) m.put("cleanse",            asp.getSpellBonusCleanse());
        if (asp.getSpellBonusRot()             != 0) m.put("rot",                asp.getSpellBonusRot());
        if (asp.getSpellBonusOffPositioning()  != 0) m.put("offPositioning",     asp.getSpellBonusOffPositioning());
        return m;
    }

    private Map<String, Double> getAbilitySpellBonusMap_double(AbilitySpell asp) {
        Map<String, Double> m = new LinkedHashMap<>();
        m.put("physicalAttack",     asp.getSpellBonusPa());
        m.put("magicPower",         asp.getSpellBonusMp());
        m.put("dexterity",          asp.getSpellBonusDex());
        m.put("element",            asp.getSpellBonusElem());
        m.put("mana",               asp.getSpellBonusMana());
        m.put("stamina",            asp.getSpellBonusStam());
        m.put("attack",             asp.getSpellBonusAttack());
        m.put("magicProficiency",   asp.getSpellBonusMagicProficiency());
        m.put("spellMastery",       asp.getSpellBonusSpellMastery());
        m.put("spellActivation",    asp.getSpellBonusSpellActivation());
        m.put("dexProficiency",     asp.getSpellBonusDexProficiency());
        m.put("dexPosture",         asp.getSpellBonusDexPosture());
        m.put("dexMaxPosture",      asp.getSpellBonusDexMaxPosture());
        m.put("critChance",         asp.getSpellBonusCritChance());
        m.put("critDamage",         asp.getSpellBonusCritDamage());
        m.put("expBonus",           asp.getSpellBonusExpBonus());
        m.put("goldBonus",          asp.getSpellBonusGoldBonus());
        m.put("itemDiscovery",      asp.getSpellBonusItemDiscovery());
        m.put("physicalImmunity",   asp.getSpellBonusPhysicalImmunity());
        m.put("magicImmunity",      asp.getSpellBonusMagicImmunity());
        m.put("dexEvasiveness",     asp.getSpellBonusDexEvasiveness());
        m.put("manaRecharge",       asp.getSpellBonusManaRecharge());
        m.put("tenacity",           asp.getSpellBonusTenacity());
        m.put("fatigueRecovery",    asp.getSpellBonusFatigueRecovery());
        m.put("cleanse",            asp.getSpellBonusCleanse());
        m.put("rot",                asp.getSpellBonusRot());
        m.put("offPositioning",     asp.getSpellBonusOffPositioning());
        return m;
    }

    /**
     * Fires all ON_DEATH ability spells for a hero that just lost a clash.
     * affectsOpponent spells debuff the enemy; passOnType spells buff own team.
     * Self-only spells (no passOnType, not affectsOpponent) are discarded — hero is dead.
     */
    private List<Map<String, Object>> fireOnDeathSpells(
            Hero dyingHero, double spellActivation, double spellMastery, Random random,
            Map<String, Double> enemyStats, List<ActiveBuff> enemyBufList,
            List<ActiveBuff> ownNextBufs, List<ActiveBuff> ownTeamBufs,
            List<ActiveBuff> enemyNextBufs, List<ActiveBuff> enemyTeamBufs) {
        List<Map<String, Object>> events = new ArrayList<>();
        for (EquippedAbility ea : equippedAbilityRepository.findByHeroIdAndSlotNumberIsNotNull(dyingHero.getId())) {
            AbilityTemplate at = ea.getAbilityTemplate();
            if (at == null) continue;
            for (AbilitySpell asp : abilitySpellRepository.findByAbilityTemplateId(at.getId())) {
                if (!"ON_DEATH".equals(asp.getSpellTrigger())) continue;
                double rawChance = asp.getSpellChance() + spellActivation;
                double effectiveChance = Math.min(1.0, rawChance);
                boolean fired = random.nextDouble() < effectiveChance;
                Map<String, Object> ev = new LinkedHashMap<>();
                ev.put("spellName", asp.getSpellName());
                ev.put("heroName", dyingHero.getTemplate().getDisplayName());
                ev.put("trigger", "ON_DEATH");
                ev.put("chance", Math.round(effectiveChance * 1000.0) / 10.0);
                ev.put("fired", fired);
                Map<String, Object> bonuses = getAbilitySpellBonusMap(asp);
                if (!bonuses.isEmpty()) ev.put("bonuses", bonuses);
                if (asp.isAffectsOpponent()) ev.put("affectsOpponent", true);
                if (asp.getPassOnType() != null) ev.put("passOn", asp.getPassOnType());
                if (!fired) { events.add(ev); continue; }
                double effectiveCost = Math.max(0.0, asp.getSpellManaCost() * (1.0 - spellMastery));
                ev.put("manaCost", Math.round(effectiveCost * 10.0) / 10.0);
                if (asp.isAffectsOpponent()) {
                    applyAbilitySpellBonuses(asp, enemyStats, enemyBufList, asp.getLastsTurns(), 1.0);
                } else if (asp.getPassOnType() != null) {
                    applyAbilityPassOnBonuses(asp, ownNextBufs, ownTeamBufs, 1.0);
                    if ("BATTLEFIELD".equals(asp.getPassOnType())) applyAbilityPassOnBonuses(asp, enemyNextBufs, enemyTeamBufs, 1.0);
                }
                // Self-only (no passOnType) — hero is dead, bonus is discarded
                events.add(ev);
            }
        }
        return events;
    }
}
