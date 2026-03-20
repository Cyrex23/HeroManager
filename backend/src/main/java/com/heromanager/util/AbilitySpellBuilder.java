package com.heromanager.util;

import com.heromanager.entity.AbilitySpell;
import com.heromanager.entity.AbilityTemplate;
import com.heromanager.repository.AbilitySpellRepository;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Single source of truth for building ability spell response maps.
 * Inject this wherever spell data needs to be serialised to JSON.
 */
@Component
public class AbilitySpellBuilder {

    private final AbilitySpellRepository abilitySpellRepository;

    public AbilitySpellBuilder(AbilitySpellRepository abilitySpellRepository) {
        this.abilitySpellRepository = abilitySpellRepository;
    }

    /** Returns a list of spell maps for the given ability template, or null if none. */
    public List<Map<String, Object>> buildSpellList(AbilityTemplate t) {
        List<AbilitySpell> spells = abilitySpellRepository.findByAbilityTemplateId(t.getId());
        if (spells.isEmpty()) return null;
        List<Map<String, Object>> result = new ArrayList<>();
        for (AbilitySpell asp : spells) {
            Map<String, Object> spell = new LinkedHashMap<>();
            spell.put("name",     asp.getSpellName());
            spell.put("manaCost", asp.getSpellManaCost());
            spell.put("trigger",  asp.getSpellTrigger());
            spell.put("chance",   asp.getSpellChance());
            if (asp.getMaxUsages()  > 0)   spell.put("maxUsages",      asp.getMaxUsages());
            if (asp.getLastsTurns() > 0)   spell.put("lastsTurns",     asp.getLastsTurns());
            if (asp.isAffectsOpponent())   spell.put("affectsOpponent", true);
            if (asp.getPassOnType() != null) spell.put("passOnType",   asp.getPassOnType());
            spell.put("bonuses", buildBonuses(asp));
            result.add(spell);
        }
        return result;
    }

    private Map<String, Object> buildBonuses(AbilitySpell asp) {
        Map<String, Object> m = new LinkedHashMap<>();
        if (asp.getSpellBonusPa()               != 0) m.put("physicalAttack",    asp.getSpellBonusPa());
        if (asp.getSpellBonusMp()               != 0) m.put("magicPower",        asp.getSpellBonusMp());
        if (asp.getSpellBonusDex()              != 0) m.put("dexterity",         asp.getSpellBonusDex());
        if (asp.getSpellBonusElem()             != 0) m.put("element",           asp.getSpellBonusElem());
        if (asp.getSpellBonusMana()             != 0) m.put("mana",              asp.getSpellBonusMana());
        if (asp.getSpellBonusStam()             != 0) m.put("stamina",           asp.getSpellBonusStam());
        if (asp.getSpellBonusAttack()           != 0) m.put("attack",            asp.getSpellBonusAttack());
        if (asp.getSpellBonusMagicProficiency() != 0) m.put("magicProficiency",  asp.getSpellBonusMagicProficiency());
        if (asp.getSpellBonusSpellMastery()     != 0) m.put("spellMastery",      asp.getSpellBonusSpellMastery());
        if (asp.getSpellBonusSpellActivation()  != 0) m.put("spellActivation",   asp.getSpellBonusSpellActivation());
        if (asp.getSpellBonusDexProficiency()   != 0) m.put("dexProficiency",    asp.getSpellBonusDexProficiency());
        if (asp.getSpellBonusDexPosture()       != 0) m.put("dexPosture",        asp.getSpellBonusDexPosture());
        if (asp.getSpellBonusDexMaxPosture()    != 0) m.put("dexMaxPosture",     asp.getSpellBonusDexMaxPosture());
        if (asp.getSpellBonusCritChance()       != 0) m.put("critChance",        asp.getSpellBonusCritChance());
        if (asp.getSpellBonusCritDamage()       != 0) m.put("critDamage",        asp.getSpellBonusCritDamage());
        if (asp.getSpellBonusExpBonus()         != 0) m.put("expBonus",          asp.getSpellBonusExpBonus());
        if (asp.getSpellBonusGoldBonus()        != 0) m.put("goldBonus",         asp.getSpellBonusGoldBonus());
        if (asp.getSpellBonusItemDiscovery()    != 0) m.put("itemDiscovery",     asp.getSpellBonusItemDiscovery());
        if (asp.getSpellBonusPhysicalImmunity() != 0) m.put("physicalImmunity",  asp.getSpellBonusPhysicalImmunity());
        if (asp.getSpellBonusMagicImmunity()    != 0) m.put("magicImmunity",     asp.getSpellBonusMagicImmunity());
        if (asp.getSpellBonusDexEvasiveness()   != 0) m.put("dexEvasiveness",    asp.getSpellBonusDexEvasiveness());
        if (asp.getSpellBonusManaRecharge()     != 0) m.put("manaRecharge",      asp.getSpellBonusManaRecharge());
        if (asp.getSpellBonusTenacity()         != 0) m.put("tenacity",          asp.getSpellBonusTenacity());
        if (asp.getSpellBonusFatigueRecovery()  != 0) m.put("fatigueRecovery",   asp.getSpellBonusFatigueRecovery());
        if (asp.getSpellBonusCleanse()          != 0) m.put("cleanse",           asp.getSpellBonusCleanse());
        if (asp.getSpellBonusRot()              != 0) m.put("rot",               asp.getSpellBonusRot());
        if (asp.getSpellBonusOffPositioning()   != 0) m.put("offPositioning",    asp.getSpellBonusOffPositioning());
        return m;
    }
}
