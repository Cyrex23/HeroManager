package com.heromanager.controller;

import com.heromanager.service.EquipmentService;
import com.heromanager.service.ShopService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/shop")
public class ShopController {

    private final ShopService shopService;
    private final EquipmentService equipmentService;

    public ShopController(ShopService shopService, EquipmentService equipmentService) {
        this.shopService = shopService;
        this.equipmentService = equipmentService;
    }

    private Long getPlayerId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @GetMapping("/heroes")
    public ResponseEntity<?> listHeroes() {
        return ResponseEntity.ok(shopService.listHeroes(getPlayerId()));
    }

    @PostMapping("/buy-hero")
    public ResponseEntity<?> buyHero(@RequestBody Map<String, Object> body) {
        Long templateId = ((Number) body.get("templateId")).longValue();
        Map<String, Object> result = shopService.buyHero(getPlayerId(), templateId);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/buy-summon")
    public ResponseEntity<?> buySummon(@RequestBody Map<String, Object> body) {
        Long templateId = ((Number) body.get("templateId")).longValue();
        Map<String, Object> result = shopService.buySummon(getPlayerId(), templateId);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/items")
    public ResponseEntity<?> listItems() {
        return ResponseEntity.ok(Map.of("items", shopService.listItems()));
    }

    @PostMapping("/buy-item")
    public ResponseEntity<?> buyItem(@RequestBody Map<String, Object> body) {
        Long itemTemplateId = ((Number) body.get("itemTemplateId")).longValue();
        Long heroId = ((Number) body.get("heroId")).longValue();
        Integer slotNumber = ((Number) body.get("slotNumber")).intValue();

        // Buy the item first
        Map<String, Object> buyResult = shopService.buyItem(getPlayerId(), itemTemplateId, heroId, slotNumber);
        if (buyResult.containsKey("error")) {
            return ResponseEntity.badRequest().body(buyResult);
        }

        // Then equip it
        Map<String, Object> equipResult = equipmentService.equipItem(getPlayerId(), heroId, itemTemplateId, slotNumber);
        if (equipResult.containsKey("error")) {
            return ResponseEntity.badRequest().body(equipResult);
        }

        return ResponseEntity.ok(buyResult);
    }

    @GetMapping("/abilities")
    public ResponseEntity<?> listAbilities(@RequestParam Long heroId) {
        return ResponseEntity.ok(Map.of("abilities", shopService.listAbilitiesForHero(getPlayerId(), heroId)));
    }

    @PostMapping("/buy-ability")
    public ResponseEntity<?> buyAbility(@RequestBody Map<String, Object> body) {
        Long abilityTemplateId = ((Number) body.get("abilityTemplateId")).longValue();
        Long heroId = ((Number) body.get("heroId")).longValue();
        Map<String, Object> result = shopService.buyAbility(getPlayerId(), abilityTemplateId, heroId);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }
}
