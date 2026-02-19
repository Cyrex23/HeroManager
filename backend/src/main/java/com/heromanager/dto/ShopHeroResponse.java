package com.heromanager.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.Map;

@Getter
@Builder
public class ShopHeroResponse {
    private Long templateId;
    private String name;
    private String displayName;
    private String imagePath;
    private int cost;
    private int capacity;
    private Map<String, Double> baseStats;
    private Map<String, Double> growthStats;
    private boolean owned;
    private String tier;
    private String element;
}
