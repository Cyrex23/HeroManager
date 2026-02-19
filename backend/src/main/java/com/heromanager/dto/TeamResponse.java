package com.heromanager.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;

@Getter
@Builder
public class TeamResponse {
    private CapacityInfo capacity;
    private double teamPower;
    private List<SlotInfo> slots;

    @Getter
    @Builder
    public static class CapacityInfo {
        private int used;
        private int max;
    }

    @Getter
    @Builder
    public static class SlotInfo {
        private int slotNumber;
        private String type;
        private String slotTier; // COMMONER, ELITE, or LEGENDARY (null for summon slot)
        private HeroSlotInfo hero;
        private SummonSlotInfo summon;
    }

    @Getter
    @Builder
    public static class HeroSlotInfo {
        private Long id;
        private String name;
        private String imagePath;
        private int level;
        private int capacity;
        private Map<String, Double> totalStats;
        private int currentXp;
        private int xpToNextLevel;
        private String tier;
        private String element;
    }

    @Getter
    @Builder
    public static class SummonSlotInfo {
        private Long id;
        private String name;
        private String imagePath;
        private int level;
        private int capacity;
        private String teamBonus;
        private int currentXp;
        private int xpToNextLevel;
    }
}
