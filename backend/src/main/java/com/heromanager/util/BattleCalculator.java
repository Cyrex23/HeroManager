package com.heromanager.util;

import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Battle calculation utility.
 * Formula: ((PA*0.5) + (MP*random(0.1-1.0)) + (Dex*0.33)) * staminaModifier
 * Includes summon MP bonus and equipment bonuses (already factored into totalStats).
 * Ties favor the defender.
 */
public class BattleCalculator {

    private BattleCalculator() {
        // utility class
    }

    /**
     * Calculate a fighter's combat power for a single round.
     *
     * @param totalStats map containing at minimum "pa", "mp", "dex" keys with their total values
     *                   (base + growth + items + abilities + summon bonuses already applied)
     * @param staminaModifier multiplier for stamina decay (1.0, 0.9, 0.81, etc.)
     * @return the computed combat power
     */
    public static double calculateCombatPower(Map<String, Double> totalStats, double staminaModifier) {
        double pa = totalStats.getOrDefault("pa", 0.0);
        double mp = totalStats.getOrDefault("mp", 0.0);
        double dex = totalStats.getOrDefault("dex", 0.0);

        double randomFactor = 0.1 + ThreadLocalRandom.current().nextDouble() * 0.9; // random(0.1-1.0)

        return ((pa * 0.5) + (mp * randomFactor) + (dex * 0.33)) * staminaModifier;
    }
}
