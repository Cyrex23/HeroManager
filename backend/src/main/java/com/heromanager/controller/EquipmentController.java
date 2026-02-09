package com.heromanager.controller;

import com.heromanager.service.EquipmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/equipment")
public class EquipmentController {

    private final EquipmentService equipmentService;

    public EquipmentController(EquipmentService equipmentService) {
        this.equipmentService = equipmentService;
    }

    private Long getPlayerId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @GetMapping("/hero/{heroId}")
    public ResponseEntity<?> getHeroEquipment(@PathVariable Long heroId) {
        return ResponseEntity.ok(equipmentService.getHeroEquipment(getPlayerId(), heroId));
    }

    @PostMapping("/equip-item")
    public ResponseEntity<?> equipItem(@RequestBody Map<String, Object> body) {
        Long heroId = ((Number) body.get("heroId")).longValue();
        Long itemTemplateId = ((Number) body.get("itemTemplateId")).longValue();
        Integer slotNumber = ((Number) body.get("slotNumber")).intValue();
        Map<String, Object> result = equipmentService.equipItem(getPlayerId(), heroId, itemTemplateId, slotNumber);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/unequip-item")
    public ResponseEntity<?> unequipItem(@RequestBody Map<String, Object> body) {
        Long heroId = ((Number) body.get("heroId")).longValue();
        Integer slotNumber = ((Number) body.get("slotNumber")).intValue();
        Map<String, Object> result = equipmentService.unequipItem(getPlayerId(), heroId, slotNumber);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/sell-item")
    public ResponseEntity<?> sellItem(@RequestBody Map<String, Object> body) {
        Long heroId = ((Number) body.get("heroId")).longValue();
        Integer slotNumber = ((Number) body.get("slotNumber")).intValue();
        Map<String, Object> result = equipmentService.sellItem(getPlayerId(), heroId, slotNumber);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/unequip-ability")
    public ResponseEntity<?> unequipAbility(@RequestBody Map<String, Object> body) {
        Long heroId = ((Number) body.get("heroId")).longValue();
        Long abilityTemplateId = ((Number) body.get("abilityTemplateId")).longValue();
        Map<String, Object> result = equipmentService.unequipAbility(getPlayerId(), heroId, abilityTemplateId);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }
}
