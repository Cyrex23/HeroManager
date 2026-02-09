package com.heromanager.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ArenaOpponentResponse {
    private Long playerId;
    private String username;
    private Double teamPower;
    private Boolean isOnline;
    private Integer heroCount;
    private Boolean hasPendingReturn;
    private Integer energyCost;
}
