package com.heromanager.dto;

import lombok.*;
import java.util.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class HeroResponse {
    private Long id;
    private Long templateId;
    private String name;
    private String imagePath;
    private Integer level;
    private Integer currentXp;
    private Integer xpToNextLevel;
    private Integer capacity;
    private Boolean isEquipped;
    private Integer teamSlot;
    private Map<String, Double> stats;
    private Map<String, Double> bonusStats;
    private List<Map<String, Object>> equippedItems;
    private List<Map<String, Object>> equippedAbilities;
}
