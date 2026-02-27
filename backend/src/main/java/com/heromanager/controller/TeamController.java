package com.heromanager.controller;

import com.heromanager.dto.TeamResponse;
import com.heromanager.dto.TeamSetupResponse;
import com.heromanager.service.TeamService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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

    @GetMapping
    public ResponseEntity<?> getTeam(Authentication auth) {
        Long playerId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(teamService.getTeamLineup(playerId));
    }

    @PostMapping("/equip-hero")
    public ResponseEntity<?> equipHero(Authentication auth, @RequestBody Map<String, Object> body) {
        Long playerId = (Long) auth.getPrincipal();
        Long heroId = ((Number) body.get("heroId")).longValue();
        int slotNumber = ((Number) body.get("slotNumber")).intValue();

        try {
            TeamResponse.CapacityInfo capacity = teamService.equipHero(playerId, heroId, slotNumber);
            return ResponseEntity.ok(Map.of("message", "Hero equipped successfully.", "capacity", capacity));
        } catch (TeamService.TeamException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }

    @PostMapping("/unequip-hero")
    public ResponseEntity<?> unequipHero(Authentication auth, @RequestBody Map<String, Object> body) {
        Long playerId = (Long) auth.getPrincipal();
        int slotNumber = ((Number) body.get("slotNumber")).intValue();

        try {
            TeamResponse.CapacityInfo capacity = teamService.unequipHero(playerId, slotNumber);
            return ResponseEntity.ok(Map.of("message", "Hero unequipped.", "capacity", capacity));
        } catch (TeamService.TeamException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }

    @PostMapping("/equip-summon")
    public ResponseEntity<?> equipSummon(Authentication auth, @RequestBody Map<String, Object> body) {
        Long playerId = (Long) auth.getPrincipal();
        Long summonId = ((Number) body.get("summonId")).longValue();

        try {
            TeamResponse.CapacityInfo capacity = teamService.equipSummon(playerId, summonId);
            return ResponseEntity.ok(Map.of("message", "Summon equipped successfully.", "capacity", capacity));
        } catch (TeamService.TeamException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }

    @PostMapping("/unequip-summon")
    public ResponseEntity<?> unequipSummon(Authentication auth) {
        Long playerId = (Long) auth.getPrincipal();

        try {
            TeamResponse.CapacityInfo capacity = teamService.unequipSummon(playerId);
            return ResponseEntity.ok(Map.of("message", "Summon unequipped.", "capacity", capacity));
        } catch (TeamService.TeamException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }

    @SuppressWarnings("unchecked")
    @PostMapping("/reorder")
    public ResponseEntity<?> reorder(Authentication auth, @RequestBody Map<String, Object> body) {
        Long playerId = (Long) auth.getPrincipal();
        List<Number> orderRaw = (List<Number>) body.get("order");
        List<Long> order = orderRaw.stream()
                .map(n -> n == null ? null : n.longValue())
                .toList();

        teamService.reorderTeam(playerId, order);
        return ResponseEntity.ok(Map.of("message", "Team order updated."));
    }

    @GetMapping("/setups")
    public ResponseEntity<List<TeamSetupResponse>> getSetups(Authentication auth) {
        Long playerId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(teamService.getSetups(playerId));
    }

    @PostMapping("/setups/switch")
    public ResponseEntity<?> switchSetup(Authentication auth, @RequestBody Map<String, Object> body) {
        Long playerId = (Long) auth.getPrincipal();
        int setupIndex = ((Number) body.get("setupIndex")).intValue();
        try {
            return ResponseEntity.ok(teamService.switchSetup(playerId, setupIndex));
        } catch (TeamService.TeamException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }

    @PutMapping("/setups/{idx}/name")
    public ResponseEntity<?> renameSetup(Authentication auth,
                                         @PathVariable int idx,
                                         @RequestBody Map<String, Object> body) {
        Long playerId = (Long) auth.getPrincipal();
        String name = (String) body.get("name");
        try {
            teamService.renameSetup(playerId, idx, name);
            return ResponseEntity.ok(Map.of("message", "Setup renamed."));
        } catch (TeamService.TeamException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }
}
