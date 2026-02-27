package com.heromanager.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FriendResponse {
    private Long playerId;
    private String username;
    private String teamName;
    private String profileImagePath;
    @JsonProperty("isOnline")
    private boolean isOnline;
    private String relationStatus;
}
