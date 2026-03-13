package com.heromanager.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PlayerResponse {
    private Long id;
    private String username;
    private int gold;
    private int diamonds;
    private double arenaEnergy;
    private int arenaEnergyMax;
    private double worldEnergy;
    private int worldEnergyMax;
    private Long nextEnergyTickSeconds;
    @JsonProperty("isOnline")
    private boolean isOnline;
    private int onlineMinutesRemaining;
    private String profileImagePath;
    private String teamName;
    private boolean chatSoundEnabled;
    private boolean extraLineupGoldPurchased;
    private boolean extraLineupDiamondsPurchased;
    private boolean energyPlusPurchased;
    private boolean heroPlusCapacityPurchased;
    private int capacityPlusCount;
    private boolean statResetUnlocked;
    private boolean extraCraftingSlotPurchased;
    private boolean doubleSpinPurchased;
    private boolean battleLogUnlocked;
    private boolean returnCapUpgraded;
    private boolean challengeLimitUpgraded;
    private boolean energyGainUpgraded;
    private double nextTickGain;
    private int lineupSlots;
    private int heroRosterMax;
    private int teamCapacityMax;
}
