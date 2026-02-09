package com.heromanager.controller;

import com.heromanager.service.TeamService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/team")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    private Long getPlayerId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @GetMapping
    public ResponseEntity<?> getTeam() {
        return ResponseEntity.ok(teamService.getTeamLineup(getPlayerId()));
    }

    @PostMapping("/equip-hero")
    public ResponseEntity<?> equipHero(@RequestBody Map<String, Object> body) {
        Long heroId = ((Number) body.get("heroId")).longValue();
        Integer slotNumber = ((Number) body.get("slotNumber")).intValue();
        Map<String, Object> result = teamService.equipHero(getPlayerId(), heroId, slotNumber);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/unequip-hero")
    public ResponseEntity<?> unequipHero(@RequestBody Map<String, Object> body) {
        Integer slotNumber = ((Number) body.get("slotNumber")).intValue();
        Map<String, Object> result = teamService.unequipHero(getPlayerId(), slotNumber);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/equip-summon")
    public ResponseEntity<?> equipSummon(@RequestBody Map<String, Object> body) {
        Long summonId = ((Number) body.get("summonId")).longValue();
        Map<String, Object> result = teamService.equipSummon(getPlayerId(), summonId);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/unequip-summon")
    public ResponseEntity<?> unequipSummon() {
        Map<String, Object> result = teamService.unequipSummon(getPlayerId());
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/reorder")
    public ResponseEntity<?> reorder(@RequestBody Map<String, Object> body) {
        List<Number> orderRaw = (List<Number>) body.get("order");
        List<Long> order = orderRaw.stream()
                .map(n -> n != null ? n.longValue() : null)
                .toList();
        Map<String, Object> result = teamService.reorderTeam(getPlayerId(), order);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }
}
