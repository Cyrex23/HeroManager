package com.heromanager.util;

import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

public class BattleCalculator {

    public record AttackBreakdown(
            double paContrib,
            double mpContrib,
            double dexContrib,
            double rawAttack,
            double staminaReduction,
            double finalAttack,
            boolean didCrit,
            boolean didMagicProf,
            double mpRoll,
            double mpFirstRoll,  // only meaningful when didMagicProf — the initial roll before reroll
            double critPaBonus   // extra PA damage added on crit (paContrib * critDamage%), 0 if no crit
    ) {}

    /**
     * Attacker-side combat modifiers derived from items and abilities.
     *
     * @param attackBonus        flat raw damage added directly to total damage; NOT tied to PA, NOT affected by stamina
     * @param magicProficiency   [0,1] probability of rerolling MP and taking the best roll
     * @param dexProficiency     bonus added to DEX contribution factor (base 0.33)
     * @param dexPosture         [0,1] fraction of DEX contribution immune to stamina penalty
     * @param critChance         [0,1] probability of a critical hit
     * @param critDamage         bonus crit multiplier added on top of the 1.5× base
     */
    public record BattleModifiers(
            double attackBonus,
            double magicProficiency,
            double dexProficiency,
            double dexPosture,
            double critChance,
            double critDamage
    ) {
        public static final BattleModifiers NONE = new BattleModifiers(0, 0, 0, 0, 0, 0);
    }

    /**
     * Calculate attack breakdown for a hero in battle.
     *
     * Base formula: ((PA × 0.5) + (MP × roll) + (DEX × (0.33 + dexProficiency))) × staminaModifier
     *               + attackBonus (flat, stamina-immune), with DEX partially immune via dexPosture.
     *
     * Immunities (defender-side) are capped at 90% to always allow some damage through.
     * A critical hit multiplies the final attack by (1.5 + critDamage).
     */
    public static AttackBreakdown calculateAttack(
            Map<String, Double> stats,
            double staminaModifier,
            BattleModifiers attackerMods,
            double defPhysImmunity,
            double defMagicImmunity,
            double defDexEvasiveness) {

        ThreadLocalRandom rng = ThreadLocalRandom.current();

        double pa  = stats.getOrDefault("physicalAttack", 0.0);
        double mp  = stats.getOrDefault("magicPower",     0.0);
        double dex = stats.getOrDefault("dexterity",      0.0);

        // ── PA contribution ────────────────────────────────────────────────────
        double paRaw = pa * 0.5 * (1.0 - defPhysImmunity);

        // ── MP contribution (Magic Proficiency = reroll) ──────────────────────
        double roll1 = rng.nextDouble(0.1, 1.0);
        double mpRoll = roll1;
        double mpFirstRoll = roll1;
        boolean didMagicProf = false;
        if (attackerMods.magicProficiency() > 0 && rng.nextDouble() < attackerMods.magicProficiency()) {
            double roll2 = rng.nextDouble(0.1, 1.0);
            mpRoll = Math.max(roll1, roll2);
            didMagicProf = true;
        }
        double mpRaw = mp * mpRoll * (1.0 - defMagicImmunity);

        // ── DEX contribution (Dex Proficiency + Dex Posture) ─────────────────
        double dexFactor = 0.33 + attackerMods.dexProficiency();
        double dexRaw = dex * dexFactor * (1.0 - defDexEvasiveness);

        // Attack bonus is flat raw damage — immune to stamina, not tied to any stat
        double attackFlat = attackerMods.attackBonus();
        double rawAttack = paRaw + mpRaw + dexRaw + attackFlat;

        // Apply stamina — dexPosture fraction of DEX is immune to the penalty
        double dexStaminaMod = staminaModifier + attackerMods.dexPosture() * (1.0 - staminaModifier);
        double paContrib  = paRaw  * staminaModifier;
        double mpContrib  = mpRaw  * staminaModifier;
        double dexContrib = dexRaw * dexStaminaMod;

        // attackFlat bypasses stamina entirely
        double statAttack = paContrib + mpContrib + dexContrib;
        double preCritAttack = statAttack + attackFlat;
        double staminaReduction = rawAttack - preCritAttack;

        // ── Critical hit (only boosts PA contribution) ────────────────────────
        boolean didCrit = rng.nextDouble() < attackerMods.critChance();
        double critPaBonus = didCrit ? paContrib * attackerMods.critDamage() : 0.0;
        double finalAttack = statAttack + critPaBonus + attackFlat;

        return new AttackBreakdown(paContrib, mpContrib, dexContrib, rawAttack, staminaReduction, finalAttack, didCrit, didMagicProf, mpRoll, mpFirstRoll, critPaBonus);
    }
}
