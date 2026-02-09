package com.heromanager.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PlayerResponse {
    private Long id;
    private String username;
    private Integer gold;
    private Integer diamonds;
    private Integer arenaEnergy;
    private Integer arenaEnergyMax;
    private Integer worldEnergy;
    private Integer worldEnergyMax;
    private Long nextEnergyTickSeconds;
    private Boolean isOnline;
    private Long onlineMinutesRemaining;
}
