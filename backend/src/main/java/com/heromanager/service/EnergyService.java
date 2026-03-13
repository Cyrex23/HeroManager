package com.heromanager.service;

import com.heromanager.entity.Player;
import com.heromanager.repository.PlayerRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class EnergyService {

    private static final int REGEN_INTERVAL_MINUTES = 10;

    private final PlayerRepository playerRepository;

    public EnergyService(PlayerRepository playerRepository) {
        this.playerRepository = playerRepository;
    }

    private int maxEnergy(Player player) {
        return player.isEnergyPlusPurchased() ? 140 : 120;
    }

    public double calculateCurrentEnergy(double storedEnergy, LocalDateTime lastUpdate) {
        long minutesPassed = Duration.between(lastUpdate, LocalDateTime.now()).toMinutes();
        long regenTicks = minutesPassed / REGEN_INTERVAL_MINUTES;
        return Math.min(120, storedEnergy + regenTicks);
    }

    public void refreshEnergy(Player player) {
        LocalDateTime now = LocalDateTime.now();
        long minutesPassed = Duration.between(player.getLastEnergyUpdate(), now).toMinutes();
        long regenTicks = minutesPassed / REGEN_INTERVAL_MINUTES;
        int max = maxEnergy(player);

        if (regenTicks > 0) {
            double gainPerTick = player.isEnergyGainUpgraded() ? 1.5 : 1.0;
            double energyGained = regenTicks * gainPerTick;
            double newArena = Math.min(max, player.getArenaEnergy() + energyGained);
            double newWorld = Math.min(max, player.getWorldEnergy() + energyGained);
            player.setArenaEnergy(newArena);
            player.setWorldEnergy(newWorld);
            // Advance lastEnergyUpdate by the ticks consumed (not to now, to preserve partial tick)
            player.setLastEnergyUpdate(
                    player.getLastEnergyUpdate().plusMinutes(regenTicks * REGEN_INTERVAL_MINUTES));
            playerRepository.save(player);
        }
    }

    public void deductArenaEnergy(Player player, int amount) {
        refreshEnergy(player);
        if (player.getArenaEnergy() < amount) {
            throw new IllegalStateException("Insufficient arena energy. Need " + amount
                    + " but have " + String.format("%.1f", player.getArenaEnergy()));
        }
        player.setArenaEnergy(player.getArenaEnergy() - amount);
        player.setLastEnergyUpdate(LocalDateTime.now());
        playerRepository.save(player);
    }

    public void setOnline(Player player) {
        player.setOnlineUntil(LocalDateTime.now().plusMinutes(40));
        playerRepository.save(player);
    }

    public boolean isOnline(Player player) {
        return player.getOnlineUntil() != null && player.getOnlineUntil().isAfter(LocalDateTime.now());
    }

    public Long getNextTickSeconds(Player player) {
        int max = maxEnergy(player);
        if (player.getArenaEnergy() >= max && player.getWorldEnergy() >= max) {
            return null;
        }
        Duration sinceLast = Duration.between(player.getLastEnergyUpdate(), LocalDateTime.now());
        long secondsIntoTick = sinceLast.toSeconds() % (REGEN_INTERVAL_MINUTES * 60);
        return (REGEN_INTERVAL_MINUTES * 60) - secondsIntoTick;
    }
}
