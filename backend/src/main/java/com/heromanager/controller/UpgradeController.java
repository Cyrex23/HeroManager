package com.heromanager.controller;

import com.heromanager.service.UpgradeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/upgrades")
public class UpgradeController {

    private final UpgradeService upgradeService;

    public UpgradeController(UpgradeService upgradeService) {
        this.upgradeService = upgradeService;
    }

    @PostMapping("/extra-lineup-gold")
    public ResponseEntity<Map<String, Object>> buyExtraLineupGold(Authentication auth) {
        Long playerId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(upgradeService.buyExtraLineupGold(playerId));
    }

    @PostMapping("/extra-lineup-diamonds")
    public ResponseEntity<Map<String, Object>> buyExtraLineupDiamonds(Authentication auth) {
        Long playerId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(upgradeService.buyExtraLineupDiamonds(playerId));
    }

    @PostMapping("/energy-plus")
    public ResponseEntity<Map<String, Object>> buyEnergyPlus(Authentication auth) {
        Long playerId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(upgradeService.buyEnergyPlus(playerId));
    }

    @PostMapping("/hero-capacity-plus")
    public ResponseEntity<Map<String, Object>> buyHeroPlusCapacity(Authentication auth) {
        Long playerId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(upgradeService.buyHeroPlusCapacity(playerId));
    }

    @PostMapping("/capacity-plus")
    public ResponseEntity<Map<String, Object>> buyCapacityPlus(Authentication auth) {
        Long playerId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(upgradeService.buyCapacityPlus(playerId));
    }
}
