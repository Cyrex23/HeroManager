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

    @GetMapping("/inventory")
    public ResponseEntity<?> getPlayerInventory(Authentication auth) {
        Long playerId = Long.parseLong(auth.getName());
        return ResponseEntity.ok(equipmentService.getPlayerInventory(playerId));
    }

    @PostMapping("/equip-item-slot")
    public ResponseEntity<?> equipItemToSlot(@RequestBody Map<String, Object> body, Authentication auth) {
        Long playerId = Long.parseLong(auth.getName());
        Long equippedItemId = ((Number) body.get("equippedItemId")).longValue();
        Long heroId = ((Number) body.get("heroId")).longValue();
        int slotNumber = ((Number) body.get("slotNumber")).intValue();
        try {
            return ResponseEntity.ok(equipmentService.equipItemToSlot(playerId, equippedItemId, heroId, slotNumber));
        } catch (EquipmentService.EquipmentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }

    @PostMapping("/unequip-item-slot")
    public ResponseEntity<?> unequipItemFromSlot(@RequestBody Map<String, Object> body, Authentication auth) {
        Long playerId = Long.parseLong(auth.getName());
        Long heroId = ((Number) body.get("heroId")).longValue();
        int slotNumber = ((Number) body.get("slotNumber")).intValue();
        try {
            return ResponseEntity.ok(equipmentService.unequipItemFromSlot(playerId, heroId, slotNumber));
        } catch (EquipmentService.EquipmentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }

    @PostMapping("/equip-ability-slot")
    public ResponseEntity<?> equipAbilityToSlot(@RequestBody Map<String, Object> body, Authentication auth) {
        Long playerId = Long.parseLong(auth.getName());
        Long equippedAbilityId = ((Number) body.get("equippedAbilityId")).longValue();
        int slotNumber = ((Number) body.get("slotNumber")).intValue();
        try {
            return ResponseEntity.ok(equipmentService.equipAbilityToSlot(playerId, equippedAbilityId, slotNumber));
        } catch (EquipmentService.EquipmentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }

    @PostMapping("/unequip-ability-slot")
    public ResponseEntity<?> unequipAbilityFromSlot(@RequestBody Map<String, Object> body, Authentication auth) {
        Long playerId = Long.parseLong(auth.getName());
        Long heroId = ((Number) body.get("heroId")).longValue();
        int slotNumber = ((Number) body.get("slotNumber")).intValue();
        try {
            return ResponseEntity.ok(equipmentService.unequipAbilityFromSlot(playerId, heroId, slotNumber));
        } catch (EquipmentService.EquipmentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }

    @PostMapping("/sell-item")
    public ResponseEntity<?> sellItem(@RequestBody Map<String, Object> body, Authentication auth) {
        Long playerId = Long.parseLong(auth.getName());
        Long equippedItemId = ((Number) body.get("equippedItemId")).longValue();
        try {
            return ResponseEntity.ok(equipmentService.sellItem(playerId, equippedItemId));
        } catch (EquipmentService.EquipmentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }

    @PostMapping("/sell-ability")
    public ResponseEntity<?> sellAbility(@RequestBody Map<String, Object> body, Authentication auth) {
        Long playerId = Long.parseLong(auth.getName());
        Long equippedAbilityId = ((Number) body.get("equippedAbilityId")).longValue();
        try {
            return ResponseEntity.ok(equipmentService.sellAbility(playerId, equippedAbilityId));
        } catch (EquipmentService.EquipmentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }
}
