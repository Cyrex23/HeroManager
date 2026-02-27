package com.heromanager.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TeamSetupResponse {
    private Long id;
    private int setupIndex;
    private String name;
    @JsonProperty("isActive")
    private boolean active;
}
