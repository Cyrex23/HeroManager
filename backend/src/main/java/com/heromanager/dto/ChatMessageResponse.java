package com.heromanager.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ChatMessageResponse {
    private Long id;
    private Long senderId;
    private String senderUsername;
    private String content;
    private String createdAt;
    @JsonProperty("isOwn")
    private boolean isOwn;
    private Long receiverId;
}
