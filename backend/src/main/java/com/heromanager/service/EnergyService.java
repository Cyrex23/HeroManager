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
    private static final int ONLINE_DURATION_MINUTES = 40;

    private final PlayerRepository playerRepository;

    public EnergyService(PlayerRepository playerRepository) {
        this.playerRepository = playerRepository;
    }

    public int calculateCurrentEnergy(Player player, String type) {
        int stored = "arena".equals(type) ? player.getArenaEnergy() : player.getWorldEnergy();
        long minutesPassed = Duration.between(player.getLastEnergyUpdate(), LocalDateTime.now()).toMinutes();
        long ticksPassed = minutesPassed / REGEN_INTERVAL_MINUTES;
        return (int) Math.min(MAX_ENERGY, stored + ticksPassed);
    }

    public void recalculateEnergy(Player player) {
        long minutesPassed = Duration.between(player.getLastEnergyUpdate(), LocalDateTime.now()).toMinutes();
        long ticksPassed = minutesPassed / REGEN_INTERVAL_MINUTES;

        if (ticksPassed > 0) {
            player.setArenaEnergy((int) Math.min(MAX_ENERGY, player.getArenaEnergy() + ticksPassed));
            player.setWorldEnergy((int) Math.min(MAX_ENERGY, player.getWorldEnergy() + ticksPassed));
            player.setLastEnergyUpdate(player.getLastEnergyUpdate().plusMinutes(ticksPassed * REGEN_INTERVAL_MINUTES));
            playerRepository.save(player);
        }
    }

    public boolean deductEnergy(Player player, int amount, String type) {
        recalculateEnergy(player);
        int current = "arena".equals(type) ? player.getArenaEnergy() : player.getWorldEnergy();

        if (current < amount) {
            return false;
        }

        if ("arena".equals(type)) {
            player.setArenaEnergy(current - amount);
        } else {
            player.setWorldEnergy(current - amount);
        }
        setOnline(player);
        playerRepository.save(player);
        return true;
    }

    public Long getNextTickSeconds(Player player) {
        int arenaEnergy = calculateCurrentEnergy(player, "arena");
        int worldEnergy = calculateCurrentEnergy(player, "world");

        if (arenaEnergy >= MAX_ENERGY && worldEnergy >= MAX_ENERGY) {
            return null;
        }

        long minutesSinceUpdate = Duration.between(player.getLastEnergyUpdate(), LocalDateTime.now()).toMinutes();
        long minutesInCurrentTick = minutesSinceUpdate % REGEN_INTERVAL_MINUTES;
        long secondsToNextTick = (REGEN_INTERVAL_MINUTES - minutesInCurrentTick) * 60;

        long secondsSinceUpdate = Duration.between(player.getLastEnergyUpdate(), LocalDateTime.now()).getSeconds();
        long secondsInCurrentTick = secondsSinceUpdate % (REGEN_INTERVAL_MINUTES * 60);

        return (REGEN_INTERVAL_MINUTES * 60) - secondsInCurrentTick;
    }

    public void setOnline(Player player) {
        player.setOnlineUntil(LocalDateTime.now().plusMinutes(ONLINE_DURATION_MINUTES));
    }

    public boolean isOnline(Player player) {
        return player.getOnlineUntil() != null && player.getOnlineUntil().isAfter(LocalDateTime.now());
    }
}
