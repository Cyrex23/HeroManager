package com.heromanager.controller;

import com.heromanager.service.EquipmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/equipment")
public class EquipmentController {

    private final EquipmentService equipmentService;

    public EquipmentController(EquipmentService equipmentService) {
        this.equipmentService = equipmentService;
    }

    @GetMapping("/hero/{heroId}")
    public ResponseEntity<?> getHeroEquipment(@PathVariable Long heroId, Authentication auth) {
        Long playerId = Long.parseLong(auth.getName());
        try {
            return ResponseEntity.ok(equipmentService.getHeroEquipment(playerId, heroId));
        } catch (EquipmentService.EquipmentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }

    @PostMapping("/equip-item")
    public ResponseEntity<?> equipItem(@RequestBody Map<String, Object> body, Authentication auth) {
        Long playerId = Long.parseLong(auth.getName());
        Long heroId = ((Number) body.get("heroId")).longValue();
        Long itemTemplateId = ((Number) body.get("itemTemplateId")).longValue();
        int slotNumber = ((Number) body.get("slotNumber")).intValue();
        try {
            return ResponseEntity.ok(equipmentService.equipItem(playerId, heroId, itemTemplateId, slotNumber));
        } catch (EquipmentService.EquipmentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }

    @PostMapping("/unequip-item")
    public ResponseEntity<?> unequipItem(@RequestBody Map<String, Object> body, Authentication auth) {
        Long playerId = Long.parseLong(auth.getName());
        Long heroId = ((Number) body.get("heroId")).longValue();
        int slotNumber = ((Number) body.get("slotNumber")).intValue();
        try {
            return ResponseEntity.ok(equipmentService.unequipItem(playerId, heroId, slotNumber));
        } catch (EquipmentService.EquipmentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }

    @PostMapping("/sell-item")
    public ResponseEntity<?> sellItem(@RequestBody Map<String, Object> body, Authentication auth) {
        Long playerId = Long.parseLong(auth.getName());
        Long heroId = ((Number) body.get("heroId")).longValue();
        int slotNumber = ((Number) body.get("slotNumber")).intValue();
        try {
            return ResponseEntity.ok(equipmentService.sellItem(playerId, heroId, slotNumber));
        } catch (EquipmentService.EquipmentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }

    @PostMapping("/unequip-ability")
    public ResponseEntity<?> unequipAbility(@RequestBody Map<String, Object> body, Authentication auth) {
        Long playerId = Long.parseLong(auth.getName());
        Long heroId = ((Number) body.get("heroId")).longValue();
        Long abilityTemplateId = ((Number) body.get("abilityTemplateId")).longValue();
        try {
            return ResponseEntity.ok(equipmentService.unequipAbility(playerId, heroId, abilityTemplateId));
        } catch (EquipmentService.EquipmentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }
}
