package com.heromanager.service;

import com.heromanager.entity.Player;
import com.heromanager.repository.PlayerRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class EnergyService {

    private static final int MAX_ENERGY = 120;
    private static final int REGEN_INTERVAL_MINUTES = 10;

    private final PlayerRepository playerRepository;

    public EnergyService(PlayerRepository playerRepository) {
        this.playerRepository = playerRepository;
    }

    public int calculateCurrentEnergy(int storedEnergy, LocalDateTime lastUpdate) {
        long minutesPassed = Duration.between(lastUpdate, LocalDateTime.now()).toMinutes();
        long regenTicks = minutesPassed / REGEN_INTERVAL_MINUTES;
        return (int) Math.min(MAX_ENERGY, storedEnergy + regenTicks);
    }

    public void refreshEnergy(Player player) {
        LocalDateTime now = LocalDateTime.now();
        long minutesPassed = Duration.between(player.getLastEnergyUpdate(), now).toMinutes();
        long regenTicks = minutesPassed / REGEN_INTERVAL_MINUTES;

        if (regenTicks > 0) {
            int newArena = (int) Math.min(MAX_ENERGY, player.getArenaEnergy() + regenTicks);
            int newWorld = (int) Math.min(MAX_ENERGY, player.getWorldEnergy() + regenTicks);
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
                    + " but have " + player.getArenaEnergy());
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
        if (player.getArenaEnergy() >= MAX_ENERGY && player.getWorldEnergy() >= MAX_ENERGY) {
            return null;
        }
        Duration sinceLast = Duration.between(player.getLastEnergyUpdate(), LocalDateTime.now());
        long secondsIntoTick = sinceLast.toSeconds() % (REGEN_INTERVAL_MINUTES * 60);
        return (REGEN_INTERVAL_MINUTES * 60) - secondsIntoTick;
    }
}
