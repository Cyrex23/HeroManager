package com.heromanager.controller;

import com.heromanager.service.ShopService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/shop")
public class ShopController {

    private final ShopService shopService;

    public ShopController(ShopService shopService) {
        this.shopService = shopService;
    }

    @GetMapping("/heroes")
    public ResponseEntity<?> listHeroes(Authentication auth) {
        Long playerId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(shopService.listHeroes(playerId));
    }

    @PostMapping("/buy-hero")
    public ResponseEntity<?> buyHero(Authentication auth, @RequestBody Map<String, Object> body) {
        Long playerId = (Long) auth.getPrincipal();
        Long templateId = ((Number) body.get("templateId")).longValue();

        try {
            return ResponseEntity.ok(shopService.buyHero(playerId, templateId));
        } catch (ShopService.ShopException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }

    @PostMapping("/buy-summon")
    public ResponseEntity<?> buySummon(Authentication auth, @RequestBody Map<String, Object> body) {
        Long playerId = (Long) auth.getPrincipal();
        Long templateId = ((Number) body.get("templateId")).longValue();

        try {
            return ResponseEntity.ok(shopService.buySummon(playerId, templateId));
        } catch (ShopService.ShopException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }

    @GetMapping("/items")
    public ResponseEntity<?> listItems() {
        return ResponseEntity.ok(shopService.listItems());
    }

    @PostMapping("/buy-item")
    public ResponseEntity<?> buyItem(Authentication auth, @RequestBody Map<String, Object> body) {
        Long playerId = (Long) auth.getPrincipal();
        Long itemTemplateId = ((Number) body.get("itemTemplateId")).longValue();

        try {
            return ResponseEntity.ok(shopService.buyItem(playerId, itemTemplateId));
        } catch (ShopService.ShopException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }

    @GetMapping("/abilities")
    public ResponseEntity<?> listAbilities(Authentication auth, @RequestParam Long heroId) {
        Long playerId = (Long) auth.getPrincipal();
        try {
            return ResponseEntity.ok(shopService.listAbilities(playerId, heroId));
        } catch (ShopService.ShopException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }

    @PostMapping("/buy-ability")
    public ResponseEntity<?> buyAbility(Authentication auth, @RequestBody Map<String, Object> body) {
        Long playerId = (Long) auth.getPrincipal();
        Long abilityTemplateId = ((Number) body.get("abilityTemplateId")).longValue();
        Long heroId = ((Number) body.get("heroId")).longValue();

        try {
            return ResponseEntity.ok(shopService.buyAbility(playerId, abilityTemplateId, heroId));
        } catch (ShopService.ShopException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }
}
