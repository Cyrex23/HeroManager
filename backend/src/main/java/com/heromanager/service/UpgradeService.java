package com.heromanager.service;

import com.heromanager.entity.Player;
import com.heromanager.repository.PlayerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class UpgradeService {

    private static final int EXTRA_LINEUP_GOLD_COST     = 2000;
    private static final int EXTRA_LINEUP_DIAMOND_COST  = 100;
    private static final int ENERGY_PLUS_DIAMOND_COST   = 40;
    private static final int HERO_CAPACITY_GOLD_COST    = 4000;
    private static final int CAPACITY_PLUS_GOLD_COST    = 8000;
    private static final int CAPACITY_PLUS_MAX          = 1;
    private static final int STAT_RESET_UNLOCK_COST       = 15000;
    private static final int EXTRA_CRAFTING_SLOT_GOLD_COST = 4000;
    private static final int DOUBLE_SPIN_DIAMOND_COST      = 50;
    private static final int BATTLE_LOG_GOLD_COST          = 500;
    private static final int RETURN_CAP_GOLD_COST          = 8000;
    private static final int CHALLENGE_LIMIT_GOLD_COST     = 13000;
    private static final int ENERGY_GAIN_GOLD_COST         = 200000;

    private final PlayerRepository playerRepository;

    public UpgradeService(PlayerRepository playerRepository) {
        this.playerRepository = playerRepository;
    }

    @Transactional
    public Map<String, Object> buyExtraLineupGold(Long playerId) {
        Player player = get(playerId);
        if (player.isExtraLineupGoldPurchased())
            throw new UpgradeException("ALREADY_PURCHASED", "Extra team setup slot (gold) already purchased.");
        if (player.getGold() < EXTRA_LINEUP_GOLD_COST)
            throw new UpgradeException("INSUFFICIENT_GOLD",
                    "Need " + EXTRA_LINEUP_GOLD_COST + " gold, you have " + player.getGold() + ".");
        player.setGold(player.getGold() - EXTRA_LINEUP_GOLD_COST);
        player.setExtraLineupGoldPurchased(true);
        playerRepository.save(player);
        return Map.of("message", "Extra team setup slot unlocked!", "goldRemaining", player.getGold());
    }

    @Transactional
    public Map<String, Object> buyExtraLineupDiamonds(Long playerId) {
        Player player = get(playerId);
        if (player.isExtraLineupDiamondsPurchased())
            throw new UpgradeException("ALREADY_PURCHASED", "Extra team setup slot (diamonds) already purchased.");
        if (player.getDiamonds() < EXTRA_LINEUP_DIAMOND_COST)
            throw new UpgradeException("INSUFFICIENT_DIAMONDS",
                    "Need " + EXTRA_LINEUP_DIAMOND_COST + " diamonds, you have " + player.getDiamonds() + ".");
        player.setDiamonds(player.getDiamonds() - EXTRA_LINEUP_DIAMOND_COST);
        player.setExtraLineupDiamondsPurchased(true);
        playerRepository.save(player);
        return Map.of("message", "Extra team setup slot unlocked!", "diamondsRemaining", player.getDiamonds());
    }

    @Transactional
    public Map<String, Object> buyEnergyPlus(Long playerId) {
        Player player = get(playerId);
        if (player.isEnergyPlusPurchased())
            throw new UpgradeException("ALREADY_PURCHASED", "Energy Plus already purchased.");
        if (player.getDiamonds() < ENERGY_PLUS_DIAMOND_COST)
            throw new UpgradeException("INSUFFICIENT_DIAMONDS",
                    "Need " + ENERGY_PLUS_DIAMOND_COST + " diamonds, you have " + player.getDiamonds() + ".");
        player.setDiamonds(player.getDiamonds() - ENERGY_PLUS_DIAMOND_COST);
        player.setEnergyPlusPurchased(true);
        // Bonus energy refill
        player.setArenaEnergy(Math.min(player.getArenaEnergy() + 40.0, 140.0));
        player.setWorldEnergy(Math.min(player.getWorldEnergy() + 40.0, 140.0));
        playerRepository.save(player);
        return Map.of("message", "Energy Plus purchased! Max energy increased to 140.", "diamondsRemaining", player.getDiamonds());
    }

    @Transactional
    public Map<String, Object> buyHeroPlusCapacity(Long playerId) {
        Player player = get(playerId);
        if (player.isHeroPlusCapacityPurchased())
            throw new UpgradeException("ALREADY_PURCHASED", "Hero Capacity Plus already purchased.");
        if (player.getGold() < HERO_CAPACITY_GOLD_COST)
            throw new UpgradeException("INSUFFICIENT_GOLD",
                    "Need " + HERO_CAPACITY_GOLD_COST + " gold, you have " + player.getGold() + ".");
        player.setGold(player.getGold() - HERO_CAPACITY_GOLD_COST);
        player.setHeroPlusCapacityPurchased(true);
        playerRepository.save(player);
        return Map.of("message", "Hero Capacity Plus purchased! Hero roster expanded to 40.", "goldRemaining", player.getGold());
    }

    @Transactional
    public Map<String, Object> buyCapacityPlus(Long playerId) {
        Player player = get(playerId);
        if (player.getCapacityPlusCount() >= CAPACITY_PLUS_MAX)
            throw new UpgradeException("MAX_REACHED", "Capacity Plus is maxed out (" + CAPACITY_PLUS_MAX + " purchases).");
        if (player.getGold() < CAPACITY_PLUS_GOLD_COST)
            throw new UpgradeException("INSUFFICIENT_GOLD",
                    "Need " + CAPACITY_PLUS_GOLD_COST + " gold, you have " + player.getGold() + ".");
        player.setGold(player.getGold() - CAPACITY_PLUS_GOLD_COST);
        player.setCapacityPlusCount(player.getCapacityPlusCount() + 1);
        playerRepository.save(player);
        int newMax = 100 + player.getCapacityPlusCount() * 10;
        return Map.of("message", "Team capacity increased to " + newMax + "!", "goldRemaining", player.getGold());
    }

    @Transactional
    public Map<String, Object> buyStatReset(Long playerId) {
        Player player = get(playerId);
        if (player.isStatResetUnlocked())
            throw new UpgradeException("ALREADY_PURCHASED", "Stat Reset already unlocked.");
        if (player.getGold() < STAT_RESET_UNLOCK_COST)
            throw new UpgradeException("INSUFFICIENT_GOLD",
                    "Need " + STAT_RESET_UNLOCK_COST + " gold, you have " + player.getGold() + ".");
        player.setGold(player.getGold() - STAT_RESET_UNLOCK_COST);
        player.setStatResetUnlocked(true);
        playerRepository.save(player);
        return Map.of("message", "Stat Reset unlocked! You can now reset hero stat allocations.", "goldRemaining", player.getGold());
    }

    @Transactional
    public Map<String, Object> buyBattleLog(Long playerId) {
        Player player = get(playerId);
        if (player.isBattleLogUnlocked())
            throw new UpgradeException("ALREADY_PURCHASED", "Battle Log already unlocked.");
        if (player.getGold() < BATTLE_LOG_GOLD_COST)
            throw new UpgradeException("INSUFFICIENT_GOLD",
                    "Need " + BATTLE_LOG_GOLD_COST + " gold, you have " + player.getGold() + ".");
        player.setGold(player.getGold() - BATTLE_LOG_GOLD_COST);
        player.setBattleLogUnlocked(true);
        playerRepository.save(player);
        return Map.of("message", "Battle Log unlocked! You can now view your full battle history.", "goldRemaining", player.getGold());
    }

    @Transactional
    public Map<String, Object> buyDoubleSpin(Long playerId) {
        Player player = get(playerId);
        if (player.isDoubleSpinPurchased())
            throw new UpgradeException("ALREADY_PURCHASED", "Double Daily Spin already purchased.");
        if (player.getDiamonds() < DOUBLE_SPIN_DIAMOND_COST)
            throw new UpgradeException("INSUFFICIENT_DIAMONDS",
                    "Need " + DOUBLE_SPIN_DIAMOND_COST + " diamonds, you have " + player.getDiamonds() + ".");
        player.setDiamonds(player.getDiamonds() - DOUBLE_SPIN_DIAMOND_COST);
        player.setDoubleSpinPurchased(true);
        playerRepository.save(player);
        return Map.of("message", "Double Daily Spin unlocked! You now get 2 spins per day.", "diamondsRemaining", player.getDiamonds());
    }

    @Transactional
    public Map<String, Object> buyExtraCraftingSlot(Long playerId) {
        Player player = get(playerId);
        if (player.isExtraCraftingSlotPurchased())
            throw new UpgradeException("ALREADY_PURCHASED", "Extra Crafting Slot already purchased.");
        if (player.getGold() < EXTRA_CRAFTING_SLOT_GOLD_COST)
            throw new UpgradeException("INSUFFICIENT_GOLD",
                    "Need " + EXTRA_CRAFTING_SLOT_GOLD_COST + " gold, you have " + player.getGold() + ".");
        player.setGold(player.getGold() - EXTRA_CRAFTING_SLOT_GOLD_COST);
        player.setExtraCraftingSlotPurchased(true);
        playerRepository.save(player);
        return Map.of("message", "Extra Crafting Slot unlocked! You can now have 2 active crafting jobs.", "goldRemaining", player.getGold());
    }

    @Transactional
    public Map<String, Object> buyReturnCap(Long playerId) {
        Player player = get(playerId);
        if (player.isReturnCapUpgraded())
            throw new UpgradeException("ALREADY_PURCHASED", "Return Queue+ already purchased.");
        if (player.getGold() < RETURN_CAP_GOLD_COST)
            throw new UpgradeException("INSUFFICIENT_GOLD",
                    "Need " + RETURN_CAP_GOLD_COST + " gold, you have " + player.getGold() + ".");
        player.setGold(player.getGold() - RETURN_CAP_GOLD_COST);
        player.setReturnCapUpgraded(true);
        playerRepository.save(player);
        return Map.of("message", "Return Queue+ unlocked! You can now queue up to 10 return challenges per opponent.", "goldRemaining", player.getGold());
    }

    @Transactional
    public Map<String, Object> buyChallengeLimitUpgrade(Long playerId) {
        Player player = get(playerId);
        if (player.isChallengeLimitUpgraded())
            throw new UpgradeException("ALREADY_PURCHASED", "Challenge Limit+ already purchased.");
        if (player.getGold() < CHALLENGE_LIMIT_GOLD_COST)
            throw new UpgradeException("INSUFFICIENT_GOLD",
                    "Need " + CHALLENGE_LIMIT_GOLD_COST + " gold, you have " + player.getGold() + ".");
        player.setGold(player.getGold() - CHALLENGE_LIMIT_GOLD_COST);
        player.setChallengeLimitUpgraded(true);
        playerRepository.save(player);
        return Map.of("message", "Challenge Limit+ unlocked! You can now challenge the same opponent up to 12 times per day.", "goldRemaining", player.getGold());
    }

    @Transactional
    public Map<String, Object> buyEnergyGainUpgrade(Long playerId) {
        Player player = get(playerId);
        if (player.isEnergyGainUpgraded())
            throw new UpgradeException("ALREADY_PURCHASED", "Energy Gain+ already purchased.");
        if (player.getGold() < ENERGY_GAIN_GOLD_COST)
            throw new UpgradeException("INSUFFICIENT_GOLD",
                    "Need " + ENERGY_GAIN_GOLD_COST + " gold, you have " + player.getGold() + ".");
        player.setGold(player.getGold() - ENERGY_GAIN_GOLD_COST);
        player.setEnergyGainUpgraded(true);
        playerRepository.save(player);
        return Map.of("message", "Energy Gain+ unlocked! Energy now regenerates at 2x per tick.", "goldRemaining", player.getGold());
    }

    private Player get(Long playerId) {
        return playerRepository.findById(playerId)
                .orElseThrow(() -> new UpgradeException("PLAYER_NOT_FOUND", "Player not found."));
    }

    public static class UpgradeException extends RuntimeException {
        private final String code;
        public UpgradeException(String code, String message) {
            super(message);
            this.code = code;
        }
        public String getCode() { return code; }
    }
}
