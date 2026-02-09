package com.heromanager.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class LoginResponse {
    private String token;
    private Long playerId;
    private String username;
}
