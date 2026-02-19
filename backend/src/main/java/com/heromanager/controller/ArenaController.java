package com.heromanager.controller;

import com.heromanager.service.ArenaService;
import com.heromanager.service.TeamService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/arena")
public class ArenaController {

    private final ArenaService arenaService;
    private final TeamService teamService;

    public ArenaController(ArenaService arenaService, TeamService teamService) {
        this.arenaService = arenaService;
        this.teamService = teamService;
    }

    @GetMapping("/opponents")
    public ResponseEntity<?> getOpponents(Authentication auth,
                                          @RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "20") int size) {
        Long playerId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(arenaService.listOpponents(playerId, page, size));
    }

    @PostMapping("/challenge")
    public ResponseEntity<?> challenge(Authentication auth, @RequestBody Map<String, Object> body) {
        Long playerId = (Long) auth.getPrincipal();
        Long defenderId = ((Number) body.get("defenderId")).longValue();

        try {
            return ResponseEntity.ok(arenaService.initiateChallenge(playerId, defenderId));
        } catch (ArenaService.ArenaException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }

    @GetMapping("/battle-log")
    public ResponseEntity<?> getBattleLog(Authentication auth,
                                          @RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "10") int size) {
        Long playerId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(arenaService.getBattleLog(playerId, page, size));
    }

    @GetMapping("/team/{playerId}")
    public ResponseEntity<?> getOpponentTeam(@PathVariable Long playerId) {
        return ResponseEntity.ok(teamService.getTeamLineup(playerId));
    }

    @GetMapping("/battle/{battleId}")
    public ResponseEntity<?> getBattle(Authentication auth, @PathVariable Long battleId) {
        Long playerId = (Long) auth.getPrincipal();
        try {
            return ResponseEntity.ok(arenaService.getBattle(playerId, battleId));
        } catch (ArenaService.ArenaException e) {
            return ResponseEntity.status(404)
                    .body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }
}
