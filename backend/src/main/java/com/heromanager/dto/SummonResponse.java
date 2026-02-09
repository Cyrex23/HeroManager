package com.heromanager.dto;

import lombok.*;
import java.util.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SummonResponse {
    private Long id;
    private Long templateId;
    private String name;
    private String displayName;
    private String imagePath;
    private Integer level;
    private Integer currentXp;
    private Integer xpToNextLevel;
    private Integer capacity;
    private Boolean isEquipped;
    private Map<String, Double> stats;
}
