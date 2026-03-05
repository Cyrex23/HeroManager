package com.heromanager.controller;

import com.heromanager.dto.DailySpinResult;
import com.heromanager.service.BlacksmithService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/blacksmith")
@RequiredArgsConstructor
public class BlacksmithController {

    private final BlacksmithService blacksmithService;

    @GetMapping("/materials")
    public ResponseEntity<?> getMaterials(Authentication auth) {
        Long playerId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(blacksmithService.getMaterials(playerId));
    }

    @GetMapping("/weapon-recipes")
    public ResponseEntity<?> getWeaponRecipes(Authentication auth) {
        Long playerId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(blacksmithService.getWeaponRecipes(playerId));
    }

    @GetMapping("/material-recipes")
    public ResponseEntity<?> getMaterialRecipes(Authentication auth) {
        Long playerId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(blacksmithService.getMaterialRecipes(playerId));
    }

    @PostMapping("/finish-now")
    public ResponseEntity<?> finishNow(Authentication auth, @RequestBody Map<String, Object> body) {
        Long playerId = (Long) auth.getPrincipal();
        String tier = body.get("tier").toString();
        try {
            int diamondsRemaining = blacksmithService.finishNow(playerId, tier);
            return ResponseEntity.ok(Map.of("diamondsRemaining", diamondsRemaining));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/craft-weapon")
    public ResponseEntity<?> craftWeapon(Authentication auth, @RequestBody Map<String, Object> body) {
        Long playerId = (Long) auth.getPrincipal();
        Long itemTemplateId = Long.valueOf(body.get("itemTemplateId").toString());
        try {
            blacksmithService.craftWeapon(playerId, itemTemplateId);
            return ResponseEntity.ok(Map.of("message", "Weapon forged successfully"));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/craft-material")
    public ResponseEntity<?> craftMaterial(Authentication auth, @RequestBody Map<String, Object> body) {
        Long playerId = (Long) auth.getPrincipal();
        Long materialRecipeId = Long.valueOf(body.get("materialRecipeId").toString());
        try {
            blacksmithService.craftMaterial(playerId, materialRecipeId);
            return ResponseEntity.ok(Map.of("message", "Material refined successfully"));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/daily-spin/status")
    public ResponseEntity<?> spinStatus(Authentication auth) {
        Long playerId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(blacksmithService.getSpinStatus(playerId));
    }

    @PostMapping("/daily-spin")
    public ResponseEntity<DailySpinResult> dailySpin(Authentication auth) {
        Long playerId = (Long) auth.getPrincipal();
        try {
            return ResponseEntity.ok(blacksmithService.claimDailySpin(playerId));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/daily-spin/claim")
    public ResponseEntity<?> claimSpinReward(Authentication auth, @RequestBody Map<String, Object> body) {
        Long playerId = (Long) auth.getPrincipal();
        String choice = body.get("choice").toString();
        try {
            blacksmithService.claimSpinReward(playerId, choice);
            return ResponseEntity.ok(Map.of("success", true, "choice", choice));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
