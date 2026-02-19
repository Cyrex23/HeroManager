package com.heromanager.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ArenaOpponentResponse {
    private Long playerId;
    private String username;
    private double teamPower;
    @JsonProperty("isOnline")
    private boolean isOnline;
    private int heroCount;
    private boolean hasPendingReturn;
    private int energyCost;
    private String profileImagePath;
    private String teamName;
}
