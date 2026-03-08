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
    private int arenaEnergy;
    private int arenaEnergyMax;
    private int worldEnergy;
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
    private int lineupSlots;
    private int heroRosterMax;
    private int teamCapacityMax;
}
