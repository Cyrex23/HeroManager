package com.heromanager.dto;

import lombok.*;
import java.util.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BattleResultResponse {
    private Long battleId;
    private String result;
    private Integer goldEarned;
    private Integer energyCost;
    private Integer arenaEnergyRemaining;
    private Map<String, Object> battleLog;
}
