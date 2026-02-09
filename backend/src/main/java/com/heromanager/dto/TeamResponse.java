package com.heromanager.dto;

import lombok.*;
import java.util.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TeamResponse {
    private Map<String, Integer> capacity;
    private Double teamPower;
    private List<Map<String, Object>> slots;
}
