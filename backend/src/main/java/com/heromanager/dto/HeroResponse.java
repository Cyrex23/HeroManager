package com.heromanager.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;

@Getter
@Builder
public class HeroResponse {
    private Long id;
    private Long templateId;
    private String name;
    private String imagePath;
    private int level;
    private int currentXp;
    private int xpToNextLevel;
    private int capacity;
    @JsonProperty("isEquipped")
    private boolean isEquipped;
    private Integer teamSlot;
    private Map<String, Double> stats;
    private Map<String, Double> baseStats;
    private Map<String, Double> growthStats;
    private Map<String, Double> bonusStats;
    private List<EquippedItemInfo> equippedItems;
    private List<EquippedAbilityInfo> equippedAbilities;
    private String tier;
    private String element;
    private int clashesWon;
    private int clashesLost;
    private int currentWinStreak;
    private int currentLossStreak;
    private double maxDamageDealt;
    private double maxDamageReceived;
    private int sellPrice;
    private int statPurchaseCount;
    private int nextStatCost;
    @JsonProperty("capacityHalved")
    private boolean capacityHalved;
    private Map<String, Double> purchasedStats;

    @Getter
    @Builder
    public static class EquippedItemInfo {
        private int slotNumber;
        private Long itemId;
        private String name;
        private Double bonusPa;
        private Double bonusMp;
        private Double bonusDex;
        private Double bonusElem;
        private Double bonusMana;
        private Double bonusStam;
    }

    @Getter
    @Builder
    public static class EquippedAbilityInfo {
        private Long abilityId;
        private String name;
        private Double bonusPa;
        private Double bonusMp;
        private Double bonusDex;
        private Double bonusElem;
        private Double bonusMana;
        private Double bonusStam;
    }
}
