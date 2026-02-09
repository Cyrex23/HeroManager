package com.heromanager.controller;

import com.heromanager.service.PlayerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/player")
public class PlayerController {

    private final PlayerService playerService;

    public PlayerController(PlayerService playerService) {
        this.playerService = playerService;
    }

    private Long getPlayerId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe() {
        return ResponseEntity.ok(playerService.getPlayerInfo(getPlayerId()));
    }

    @GetMapping("/heroes")
    public ResponseEntity<?> getHeroes() {
        return ResponseEntity.ok(Map.of("heroes", playerService.getHeroes(getPlayerId())));
    }

    @GetMapping("/summons")
    public ResponseEntity<?> getSummons() {
        return ResponseEntity.ok(Map.of("summons", playerService.getSummons(getPlayerId())));
    }
}
