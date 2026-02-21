package com.heromanager.controller;

import com.heromanager.service.EquipmentService;
import com.heromanager.service.PlayerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/player")
public class PlayerController {

    private final PlayerService playerService;
    private final EquipmentService equipmentService;

    public PlayerController(PlayerService playerService, EquipmentService equipmentService) {
        this.playerService = playerService;
        this.equipmentService = equipmentService;
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

    @GetMapping("/hero/{heroId}")
    public ResponseEntity<?> getHero(@PathVariable Long heroId, Authentication auth) {
        Long playerId = (Long) auth.getPrincipal();
        var hero = playerService.getHero(playerId, heroId);
        if (hero == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(hero);
    }

    @GetMapping("/summons")
    public ResponseEntity<?> getSummons(Authentication auth) {
        Long playerId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(Map.of("summons", playerService.getSummons(playerId)));
    }

    @GetMapping("/full-inventory")
    public ResponseEntity<?> getFullInventory(Authentication auth) {
        Long playerId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(equipmentService.getFullInventory(playerId));
    }

    @PostMapping("/sell-hero")
    public ResponseEntity<?> sellHero(@RequestBody Map<String, Object> body, Authentication auth) {
        Long playerId = (Long) auth.getPrincipal();
        Long heroId = ((Number) body.get("heroId")).longValue();
        try {
            return ResponseEntity.ok(playerService.sellHero(playerId, heroId));
        } catch (PlayerService.HeroSellException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }
}
