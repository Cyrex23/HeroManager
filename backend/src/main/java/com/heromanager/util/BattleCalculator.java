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
            double finalAttack
    ) {}

    /**
     * Calculate attack breakdown for a hero in battle.
     * Formula: ((PA*0.5) + (MP*random(0.1-1.0)) + (Dex*0.33)) * staminaModifier
     */
    public static AttackBreakdown calculateAttack(Map<String, Double> stats, double staminaModifier) {
        double pa = stats.getOrDefault("physicalAttack", 0.0);
        double mp = stats.getOrDefault("magicPower", 0.0);
        double dex = stats.getOrDefault("dexterity", 0.0);

        double randomFactor = ThreadLocalRandom.current().nextDouble(0.1, 1.0);
        double paContrib = pa * 0.5;
        double mpContrib = mp * randomFactor;
        double dexContrib = dex * 0.33;
        double rawAttack = paContrib + mpContrib + dexContrib;
        double finalAttack = rawAttack * staminaModifier;
        double staminaReduction = rawAttack - finalAttack;

        return new AttackBreakdown(paContrib, mpContrib, dexContrib, rawAttack, staminaReduction, finalAttack);
    }
}
