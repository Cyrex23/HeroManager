package com.heromanager.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BattleResultResponse {
    private Long battleId;
    private String result;
    private int goldEarned;
    private int energyCost;
    private int arenaEnergyRemaining;
    private Object battleLog;
}
