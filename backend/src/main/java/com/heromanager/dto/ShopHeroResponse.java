package com.heromanager.dto;

import lombok.*;
import java.util.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ShopHeroResponse {
    private Long templateId;
    private String name;
    private String displayName;
    private String imagePath;
    private Integer cost;
    private Integer capacity;
    private Map<String, Double> baseStats;
    private Map<String, Double> growthStats;
    private Boolean owned;
}
