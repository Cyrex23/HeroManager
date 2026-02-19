package com.heromanager.controller;

import com.heromanager.service.PlayerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/player")
public class PlayerController {

    private final PlayerService playerService;

    public PlayerController(PlayerService playerService) {
        this.playerService = playerService;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(Authentication auth) {
        Long playerId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(playerService.getPlayerInfo(playerId));
    }

    @GetMapping("/heroes")
    public ResponseEntity<?> getHeroes(Authentication auth) {
        Long playerId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(Map.of("heroes", playerService.getHeroes(playerId)));
    }

    @GetMapping("/summons")
    public ResponseEntity<?> getSummons(Authentication auth) {
        Long playerId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(Map.of("summons", playerService.getSummons(playerId)));
    }
}
