package com.heromanager.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

import java.util.Map;

@Getter
@Builder
public class SummonResponse {
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
    private Map<String, Double> stats;
    private String teamBonus;
    private int sellPrice;
    @JsonProperty("capacityHalved")
    private boolean capacityHalved;
}
