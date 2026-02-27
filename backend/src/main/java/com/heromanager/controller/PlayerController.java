package com.heromanager.controller;

import com.heromanager.repository.PlayerRepository;
import com.heromanager.service.EquipmentService;
import com.heromanager.service.PlayerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/player")
public class PlayerController {

    private final PlayerService playerService;
    private final EquipmentService equipmentService;
    private final PlayerRepository playerRepository;

    public PlayerController(PlayerService playerService, EquipmentService equipmentService,
                             PlayerRepository playerRepository) {
        this.playerService = playerService;
        this.equipmentService = equipmentService;
        this.playerRepository = playerRepository;
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

    @GetMapping("/summon/{summonId}")
    public ResponseEntity<?> getSummon(@PathVariable Long summonId, Authentication auth) {
        Long playerId = (Long) auth.getPrincipal();
        var summon = playerService.getSummon(playerId, summonId);
        if (summon == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(summon);
    }

    @PostMapping("/summon/{summonId}/halve-capacity")
    public ResponseEntity<?> halveSummonCapacity(@PathVariable Long summonId, Authentication auth) {
        Long playerId = (Long) auth.getPrincipal();
        try {
            return ResponseEntity.ok(playerService.halveSummonCapacity(playerId, summonId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/sell-summon")
    public ResponseEntity<?> sellSummon(@RequestBody Map<String, Object> body, Authentication auth) {
        Long playerId = (Long) auth.getPrincipal();
        Long summonId = ((Number) body.get("summonId")).longValue();
        try {
            return ResponseEntity.ok(playerService.sellSummon(playerId, summonId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/full-inventory")
    public ResponseEntity<?> getFullInventory(Authentication auth) {
        Long playerId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(equipmentService.getFullInventory(playerId));
    }

    @GetMapping("/online-count")
    public ResponseEntity<?> getOnlineCount() {
        long count = playerRepository.countOnlinePlayers(LocalDateTime.now());
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PostMapping("/hero/{heroId}/halve-capacity")
    public ResponseEntity<?> halveCapacity(@PathVariable Long heroId, Authentication auth) {
        Long playerId = (Long) auth.getPrincipal();
        try {
            return ResponseEntity.ok(playerService.halveCapacity(playerId, heroId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/hero/{heroId}/buy-stats")
    public ResponseEntity<?> buyStats(@PathVariable Long heroId,
                                      @RequestBody Map<String, Integer> allocation,
                                      Authentication auth) {
        Long playerId = (Long) auth.getPrincipal();
        try {
            return ResponseEntity.ok(playerService.buyStats(playerId, heroId, allocation));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
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
