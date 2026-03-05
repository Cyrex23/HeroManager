package com.heromanager.dto;

import java.util.List;

public record WeaponRecipeResponse(
    Long recipeId,
    Long itemTemplateId,
    String name,
    String iconKey,
    String weaponTier,
    int cost,
    // Base stats
    double bonusPa,
    double bonusMp,
    double bonusDex,
    double bonusElem,
    double bonusMana,
    double bonusStam,
    // Combat modifiers
    double bonusAttack,
    double bonusMagicProficiency,
    double bonusSpellMastery,
    double bonusSpellActivation,
    double bonusDexProficiency,
    double bonusDexPosture,
    double bonusCritChance,
    double bonusCritDamage,
    // Progression
    double bonusExpBonus,
    double bonusGoldBonus,
    double bonusItemDiscovery,
    // Defenses
    double bonusPhysicalImmunity,
    double bonusMagicImmunity,
    double bonusDexEvasiveness,
    // Spells (multiple)
    List<SpellInfo> spells,
    int craftHours,
    List<WeaponIngredient> ingredients
) {
    public record SpellInfo(
        String name,
        int manaCost,
        String trigger,
        double chance,
        // Base stats
        double bonusPa,
        double bonusMp,
        double bonusDex,
        double bonusElem,
        double bonusMana,
        double bonusStam,
        // Combat modifiers
        double bonusAttack,
        double bonusMagicProficiency,
        double bonusSpellMastery,
        double bonusSpellActivation,
        double bonusDexProficiency,
        double bonusDexPosture,
        double bonusCritChance,
        double bonusCritDamage,
        // Progression
        double bonusExpBonus,
        double bonusGoldBonus,
        double bonusItemDiscovery,
        // Immunities
        double bonusPhysicalImmunity,
        double bonusMagicImmunity,
        double bonusDexEvasiveness,
        // Meta
        int maxUsages,
        int lastsTurns,
        boolean affectsOpponent,
        int turnThreshold
    ) {}

    public record WeaponIngredient(
        Long materialId,
        String materialName,
        String iconKey,
        int required,
        int have
    ) {}
}
